use std::{error::Error, fmt, fs, io, path::Path};

use crate::models::proxy::{ProxyImportCandidate, ProxyKind, ProxyScheme, ShellKind};
use crate::shell::profile::profile_path_from_home_dir;

pub fn scan_proxy_import_candidates(
    home_dir: &Path,
) -> Result<Vec<ProxyImportCandidate>, ImportScanError> {
    let mut candidates = Vec::new();

    for shell in [ShellKind::Zsh, ShellKind::Bash, ShellKind::PowerShell] {
        let profile_path = profile_path_from_home_dir(home_dir, shell);
        let content = match fs::read_to_string(&profile_path) {
            Ok(content) => content,
            Err(error) if error.kind() == io::ErrorKind::NotFound => continue,
            Err(error) => return Err(ImportScanError::Io(error.to_string())),
        };

        candidates.extend(scan_profile_content(&profile_path, shell, &content));
    }

    Ok(candidates)
}

pub fn scan_profile_content(
    profile_path: &Path,
    shell: ShellKind,
    content: &str,
) -> Vec<ProxyImportCandidate> {
    content
        .lines()
        .enumerate()
        .filter_map(|(index, line)| parse_proxy_assignment(profile_path, shell, index + 1, line))
        .collect()
}

fn parse_proxy_assignment(
    profile_path: &Path,
    shell: ShellKind,
    line_number: usize,
    line: &str,
) -> Option<ProxyImportCandidate> {
    let (kind, raw_value) = match shell {
        ShellKind::Zsh | ShellKind::Bash => parse_posix_assignment(line)?,
        ShellKind::PowerShell => parse_powershell_assignment(line)?,
    };
    let (scheme, host, port) = parse_proxy_url(raw_value)?;
    let source_path = profile_path.to_string_lossy().into_owned();
    let env_name = env_name(kind);

    Some(ProxyImportCandidate {
        id: format!("{source_path}:{line_number}:{env_name}"),
        name: format!("{env_name} {host}:{port}"),
        kind,
        scheme,
        host,
        port,
        shell,
        source_path,
        line_number,
    })
}

fn parse_posix_assignment(line: &str) -> Option<(ProxyKind, &str)> {
    let line = line.trim();
    let assignment = line.strip_prefix("export ")?;
    let (name, value) = assignment.split_once('=')?;
    let kind = parse_proxy_kind(name.trim())?;

    Some((kind, trim_shell_value(value.trim())))
}

fn parse_powershell_assignment(line: &str) -> Option<(ProxyKind, &str)> {
    let line = line.trim();
    let assignment = line.strip_prefix("$env:")?;
    let (name, value) = assignment.split_once('=')?;
    let kind = parse_proxy_kind(name.trim())?;

    Some((kind, trim_shell_value(value.trim())))
}

fn parse_proxy_kind(name: &str) -> Option<ProxyKind> {
    match name {
        "http_proxy" => Some(ProxyKind::HttpProxy),
        "https_proxy" => Some(ProxyKind::HttpsProxy),
        "ALL_PROXY" => Some(ProxyKind::AllProxy),
        _ => None,
    }
}

fn parse_proxy_url(value: &str) -> Option<(ProxyScheme, String, u16)> {
    let (scheme, rest) = value.split_once("://")?;
    let scheme = match scheme {
        "http" => ProxyScheme::Http,
        "https" => ProxyScheme::Https,
        "socks4" => ProxyScheme::Socks4,
        "socks5" => ProxyScheme::Socks5,
        _ => return None,
    };
    let host_port = rest
        .split(['/', '?', '#'])
        .next()
        .unwrap_or_default()
        .trim();

    // MVP 不导入含认证信息的 URL，避免把用户名密码迁入本地配置。
    if host_port.contains('@') {
        return None;
    }

    let (host, port) = host_port.rsplit_once(':')?;
    let port = port.parse::<u16>().ok()?;
    let host = host.trim();

    if host.is_empty() {
        return None;
    }

    Some((scheme, host.to_string(), port))
}

fn trim_shell_value(value: &str) -> &str {
    value
        .strip_prefix('"')
        .and_then(|next| next.strip_suffix('"'))
        .or_else(|| {
            value
                .strip_prefix('\'')
                .and_then(|next| next.strip_suffix('\''))
        })
        .unwrap_or(value)
}

fn env_name(kind: ProxyKind) -> &'static str {
    match kind {
        ProxyKind::HttpProxy => "http_proxy",
        ProxyKind::HttpsProxy => "https_proxy",
        ProxyKind::AllProxy => "ALL_PROXY",
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum ImportScanError {
    Io(String),
}

impl fmt::Display for ImportScanError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(message) => write!(formatter, "profile import scan I/O error: {message}"),
        }
    }
}

impl Error for ImportScanError {}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn scans_posix_export_proxy_assignments() {
        let candidates = scan_profile_content(
            &PathBuf::from("/Users/example/.zshrc"),
            ShellKind::Zsh,
            "export http_proxy=http://127.0.0.1:1087\nexport ALL_PROXY=\"socks5://10.0.0.2:1080\"\n",
        );

        assert_eq!(candidates.len(), 2);
        assert_eq!(candidates[0].kind, ProxyKind::HttpProxy);
        assert_eq!(candidates[0].scheme, ProxyScheme::Http);
        assert_eq!(candidates[0].host, "127.0.0.1");
        assert_eq!(candidates[0].port, 1087);
        assert_eq!(candidates[1].kind, ProxyKind::AllProxy);
        assert_eq!(candidates[1].scheme, ProxyScheme::Socks5);
    }

    #[test]
    fn scans_powershell_proxy_assignments() {
        let candidates = scan_profile_content(
            &PathBuf::from(
                r"C:\Users\example\Documents\PowerShell\Microsoft.PowerShell_profile.ps1",
            ),
            ShellKind::PowerShell,
            "$env:https_proxy = \"https://127.0.0.1:1087\"\n",
        );

        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].kind, ProxyKind::HttpsProxy);
        assert_eq!(candidates[0].scheme, ProxyScheme::Https);
        assert_eq!(candidates[0].host, "127.0.0.1");
        assert_eq!(candidates[0].port, 1087);
        assert_eq!(candidates[0].shell, ShellKind::PowerShell);
    }

    #[test]
    fn skips_unsupported_or_authenticated_proxy_values() {
        let candidates = scan_profile_content(
            &PathBuf::from("/Users/example/.bashrc"),
            ShellKind::Bash,
            "export HTTP_PROXY=http://127.0.0.1:1087\nexport http_proxy=http://user:pass@127.0.0.1:1087\nexport https_proxy=ftp://127.0.0.1:21\n",
        );

        assert!(candidates.is_empty());
    }
}
