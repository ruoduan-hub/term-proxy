use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::{
    models::proxy::ProxyStore,
    shell::script::{render_posix_proxy_script, render_powershell_proxy_script},
    storage::proxy_store::ProxyStorageError,
};

#[derive(Debug, PartialEq, Eq)]
pub struct ManagedProxyFiles {
    pub posix_path: PathBuf,
    pub powershell_path: PathBuf,
}

pub fn managed_proxy_directory_from_home_dir(home_dir: &Path) -> PathBuf {
    home_dir.join(".term-proxy")
}

pub fn write_managed_proxy_files(
    directory: &Path,
    store: &ProxyStore,
) -> Result<ManagedProxyFiles, ProxyStorageError> {
    fs::create_dir_all(directory).map_err(|error| ProxyStorageError::Io(error.to_string()))?;

    let posix_path = directory.join("proxy.sh");
    let powershell_path = directory.join("proxy.ps1");

    // 先写临时文件再替换目标文件，避免用户 profile source 到半截内容。
    write_replace(&posix_path, &render_posix_proxy_script(store))?;
    write_replace(&powershell_path, &render_powershell_proxy_script(store))?;

    Ok(ManagedProxyFiles {
        posix_path,
        powershell_path,
    })
}

fn write_replace(path: &Path, content: &str) -> Result<(), ProxyStorageError> {
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| ProxyStorageError::Io("invalid managed proxy file path".to_string()))?;
    let temp_path = path.with_file_name(format!("{file_name}.tmp"));

    fs::write(&temp_path, content).map_err(|error| ProxyStorageError::Io(error.to_string()))?;

    match fs::rename(&temp_path, path) {
        Ok(()) => Ok(()),
        Err(_) if path.exists() => {
            fs::remove_file(path).map_err(|error| ProxyStorageError::Io(error.to_string()))?;
            fs::rename(&temp_path, path).map_err(|error| ProxyStorageError::Io(error.to_string()))
        }
        Err(error) => Err(ProxyStorageError::Io(error.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::*;
    use crate::models::proxy::{ProxyConfig, ProxyKind, ProxyScheme};

    fn temp_home_dir(name: &str) -> PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be valid")
            .as_nanos();
        std::env::temp_dir().join(format!("term-proxy-home-{name}-{suffix}"))
    }

    fn proxy(id: &str, kind: ProxyKind, enabled: bool) -> ProxyConfig {
        ProxyConfig {
            id: id.to_string(),
            name: id.to_string(),
            kind,
            scheme: ProxyScheme::Http,
            host: "127.0.0.1".to_string(),
            port: 1087,
            enabled,
            created_at: "2026-06-26T00:00:00Z".to_string(),
            updated_at: "2026-06-26T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn managed_proxy_directory_uses_hidden_home_folder() {
        let home_dir = PathBuf::from("/Users/example");

        let directory = managed_proxy_directory_from_home_dir(&home_dir);

        assert_eq!(directory, home_dir.join(".term-proxy"));
    }

    #[test]
    fn writes_managed_proxy_scripts() {
        let home_dir = temp_home_dir("scripts");
        let directory = managed_proxy_directory_from_home_dir(&home_dir);
        let mut store = ProxyStore::default();
        store.proxies = vec![
            proxy("http-a", ProxyKind::HttpProxy, true),
            proxy("https-a", ProxyKind::HttpsProxy, false),
            proxy("all-a", ProxyKind::AllProxy, true),
        ];

        let files = write_managed_proxy_files(&directory, &store)
            .expect("managed proxy scripts should be written");

        let posix = fs::read_to_string(&files.posix_path).expect("POSIX script should exist");
        let powershell =
            fs::read_to_string(&files.powershell_path).expect("PowerShell script should exist");

        assert_eq!(files.posix_path, directory.join("proxy.sh"));
        assert_eq!(files.powershell_path, directory.join("proxy.ps1"));
        assert!(posix.contains("export http_proxy=\"http://127.0.0.1:1087\""));
        assert!(posix.contains("export ALL_PROXY=\"http://127.0.0.1:1087\""));
        assert!(!posix.contains("export https_proxy="));
        assert!(powershell.contains("$env:http_proxy = \"http://127.0.0.1:1087\""));
        assert!(powershell.contains("$env:ALL_PROXY = \"http://127.0.0.1:1087\""));
        assert!(!powershell.contains("$env:https_proxy"));

        let _ = fs::remove_dir_all(home_dir);
    }
}
