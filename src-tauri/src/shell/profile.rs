use std::{
    error::Error,
    fmt, fs, io,
    path::{Path, PathBuf},
};

use crate::models::proxy::ShellKind;

const MARKER_START: &str = "# >>> term-proxy initialize >>>";
const MARKER_END: &str = "# <<< term-proxy initialize <<<";

pub fn profile_path_from_home_dir(home_dir: &Path, shell: ShellKind) -> PathBuf {
    match shell {
        ShellKind::Zsh => home_dir.join(".zshrc"),
        ShellKind::Bash => home_dir.join(".bashrc"),
        ShellKind::PowerShell => home_dir
            .join("Documents")
            .join("PowerShell")
            .join("Microsoft.PowerShell_profile.ps1"),
    }
}

pub fn install_profile_marker_file(
    profile_path: &Path,
    shell: ShellKind,
) -> Result<(), ProfileIntegrationError> {
    let content = read_profile_or_empty(profile_path)?;
    let next = install_profile_marker(&content, shell);
    write_replace(profile_path, &next)
}

pub fn remove_profile_marker_file(profile_path: &Path) -> Result<(), ProfileIntegrationError> {
    let content = read_profile_or_empty(profile_path)?;
    let next = remove_profile_marker(&content);
    write_replace(profile_path, &next)
}

pub fn install_profile_marker(content: &str, shell: ShellKind) -> String {
    let content_without_marker = remove_profile_marker(content);
    let mut next = content_without_marker;

    if !next.is_empty() && !next.ends_with('\n') {
        next.push('\n');
    }

    if !next.is_empty() {
        next.push('\n');
    }

    next.push_str(&profile_marker(shell));
    next
}

pub fn remove_profile_marker(content: &str) -> String {
    let Some(start) = content.find(MARKER_START) else {
        return content.to_string();
    };
    let Some(relative_end) = content[start..].find(MARKER_END) else {
        return content.to_string();
    };

    let marker_end = start + relative_end + MARKER_END.len();
    let marker_end = if content[marker_end..].starts_with("\r\n") {
        marker_end + 2
    } else if content[marker_end..].starts_with('\n') {
        marker_end + 1
    } else {
        marker_end
    };

    let prefix = &content[..start];
    let suffix = trim_one_leading_newline_if_needed(prefix, &content[marker_end..]);

    let mut next = String::with_capacity(content.len().saturating_sub(marker_end - start));
    next.push_str(prefix);
    next.push_str(suffix);
    next
}

pub fn profile_marker(shell: ShellKind) -> String {
    match shell {
        ShellKind::Zsh | ShellKind::Bash => format!(
            "{MARKER_START}\n[ -f \"$HOME/.term-proxy/proxy.sh\" ] && source \"$HOME/.term-proxy/proxy.sh\"\n{MARKER_END}\n"
        ),
        ShellKind::PowerShell => format!(
            "{MARKER_START}\n$termProxyProfile = Join-Path $HOME \".term-proxy\\proxy.ps1\"\nif (Test-Path $termProxyProfile) {{ . $termProxyProfile }}\n{MARKER_END}\n"
        ),
    }
}

fn trim_one_leading_newline_if_needed<'a>(prefix: &str, suffix: &'a str) -> &'a str {
    if !prefix.ends_with('\n') {
        return suffix;
    }

    if let Some(next) = suffix.strip_prefix("\r\n") {
        return next;
    }

    suffix.strip_prefix('\n').unwrap_or(suffix)
}

fn read_profile_or_empty(profile_path: &Path) -> Result<String, ProfileIntegrationError> {
    match fs::read_to_string(profile_path) {
        Ok(content) => Ok(content),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(String::new()),
        Err(error) => Err(ProfileIntegrationError::Io(error.to_string())),
    }
}

fn write_replace(path: &Path, content: &str) -> Result<(), ProfileIntegrationError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| ProfileIntegrationError::Io(error.to_string()))?;
    }

    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| ProfileIntegrationError::Io("invalid profile path".to_string()))?;
    let temp_path = path.with_file_name(format!("{file_name}.tmp"));

    fs::write(&temp_path, content)
        .map_err(|error| ProfileIntegrationError::Io(error.to_string()))?;

    match fs::rename(&temp_path, path) {
        Ok(()) => Ok(()),
        Err(_) if path.exists() => {
            fs::remove_file(path)
                .map_err(|error| ProfileIntegrationError::Io(error.to_string()))?;
            fs::rename(&temp_path, path)
                .map_err(|error| ProfileIntegrationError::Io(error.to_string()))
        }
        Err(error) => Err(ProfileIntegrationError::Io(error.to_string())),
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum ProfileIntegrationError {
    Io(String),
}

impl fmt::Display for ProfileIntegrationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(message) => write!(formatter, "profile integration I/O error: {message}"),
        }
    }
}

impl Error for ProfileIntegrationError {}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::*;

    #[test]
    fn profile_path_uses_expected_shell_files() {
        let home_dir = PathBuf::from("/Users/example");

        assert_eq!(
            profile_path_from_home_dir(&home_dir, ShellKind::Zsh),
            home_dir.join(".zshrc")
        );
        assert_eq!(
            profile_path_from_home_dir(&home_dir, ShellKind::Bash),
            home_dir.join(".bashrc")
        );
        assert_eq!(
            profile_path_from_home_dir(&home_dir, ShellKind::PowerShell),
            home_dir
                .join("Documents")
                .join("PowerShell")
                .join("Microsoft.PowerShell_profile.ps1")
        );
    }

    #[test]
    fn install_posix_marker_preserves_existing_profile_content() {
        let existing = "alias ll='ls -la'\n";

        let updated = install_profile_marker(existing, ShellKind::Zsh);

        assert!(updated.contains("alias ll='ls -la'"));
        assert!(updated.contains("# >>> term-proxy initialize >>>"));
        assert!(updated.contains(
            "[ -f \"$HOME/.term-proxy/proxy.sh\" ] && source \"$HOME/.term-proxy/proxy.sh\""
        ));
        assert!(updated.contains("# <<< term-proxy initialize <<<"));
    }

    #[test]
    fn install_powershell_marker_uses_powershell_source_syntax() {
        let updated = install_profile_marker("", ShellKind::PowerShell);

        assert!(updated.contains("$termProxyProfile = Join-Path $HOME \".term-proxy\\proxy.ps1\""));
        assert!(updated.contains("if (Test-Path $termProxyProfile) { . $termProxyProfile }"));
    }

    #[test]
    fn repeated_install_replaces_existing_marker_without_duplication() {
        let once = install_profile_marker("echo before\n", ShellKind::Zsh);
        let twice = install_profile_marker(&once, ShellKind::Zsh);

        assert_eq!(twice.matches("# >>> term-proxy initialize >>>").count(), 1);
        assert_eq!(twice.matches("# <<< term-proxy initialize <<<").count(), 1);
        assert!(twice.contains("echo before"));
    }

    #[test]
    fn remove_profile_marker_deletes_only_managed_block() {
        let content = format!("before\n{}\nafter\n", profile_marker(ShellKind::Bash));

        let updated = remove_profile_marker(&content);

        assert_eq!(updated, "before\nafter\n");
    }

    #[test]
    fn install_profile_marker_file_creates_parent_and_preserves_content() {
        let profile_path = temp_profile_path("install").join("nested").join(".zshrc");

        install_profile_marker_file(&profile_path, ShellKind::Zsh)
            .expect("profile marker should install");

        let content = fs::read_to_string(&profile_path).expect("profile should exist");

        assert!(content.contains(MARKER_START));
        assert!(content.contains("proxy.sh"));

        let _ = fs::remove_dir_all(profile_path.parent().unwrap().parent().unwrap());
    }

    #[test]
    fn remove_profile_marker_file_preserves_user_content() {
        let profile_dir = temp_profile_path("remove");
        let profile_path = profile_dir.join(".bashrc");
        fs::create_dir_all(&profile_dir).expect("temp profile directory should be created");
        fs::write(
            &profile_path,
            format!("before\n{}\nafter\n", profile_marker(ShellKind::Bash)),
        )
        .expect("profile fixture should be written");

        remove_profile_marker_file(&profile_path).expect("profile marker should remove");

        let content = fs::read_to_string(&profile_path).expect("profile should exist");
        assert_eq!(content, "before\nafter\n");

        let _ = fs::remove_dir_all(profile_dir);
    }

    fn temp_profile_path(name: &str) -> PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be valid")
            .as_nanos();
        std::env::temp_dir().join(format!("term-proxy-profile-{name}-{suffix}"))
    }
}
