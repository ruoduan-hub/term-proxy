use std::{error::Error, fmt};
use std::{fs, io, path::Path};

use crate::models::proxy::ProxyStore;
use crate::services::proxy::{enable_proxy, ProxyServiceError};

pub fn load_proxy_store(path: &Path) -> Result<ProxyStore, ProxyStorageError> {
    match fs::read_to_string(path) {
        Ok(content) => serde_json::from_str(&content)
            .map_err(|error| ProxyStorageError::Json(error.to_string())),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(ProxyStore::default()),
        Err(error) => Err(ProxyStorageError::Io(error.to_string())),
    }
}

pub fn save_proxy_store(path: &Path, store: &ProxyStore) -> Result<(), ProxyStorageError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| ProxyStorageError::Io(error.to_string()))?;
    }

    let content = serde_json::to_string_pretty(store)
        .map_err(|error| ProxyStorageError::Json(error.to_string()))?;

    fs::write(path, content).map_err(|error| ProxyStorageError::Io(error.to_string()))
}

pub fn enable_proxy_in_store(
    path: &Path,
    target_id: &str,
) -> Result<ProxyStore, ProxyStorageError> {
    let mut store = load_proxy_store(path)?;
    store.proxies = enable_proxy(store.proxies, target_id).map_err(ProxyStorageError::Service)?;
    save_proxy_store(path, &store)?;
    Ok(store)
}

#[derive(Debug, PartialEq, Eq)]
pub enum ProxyStorageError {
    Io(String),
    Json(String),
    Service(ProxyServiceError),
}

impl fmt::Display for ProxyStorageError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(message) => write!(formatter, "proxy store I/O error: {message}"),
            Self::Json(message) => write!(formatter, "proxy store JSON error: {message}"),
            Self::Service(error) => write!(formatter, "proxy service error: {error}"),
        }
    }
}

impl Error for ProxyStorageError {}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::*;
    use crate::models::proxy::{ProxyConfig, ProxyKind, ProxyScheme};

    fn temp_store_path(name: &str) -> std::path::PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be valid")
            .as_nanos();
        std::env::temp_dir()
            .join(format!("term-proxy-{name}-{suffix}"))
            .join("proxy-store.json")
    }

    fn proxy(id: &str, kind: ProxyKind, enabled: bool) -> ProxyConfig {
        ProxyConfig {
            id: id.to_string(),
            name: id.to_string(),
            kind,
            scheme: ProxyScheme::Http,
            host: "127.0.0.1".to_string(),
            port: 1087,
            username: None,
            password: None,
            enabled,
            created_at: "2026-06-26T00:00:00Z".to_string(),
            updated_at: "2026-06-26T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn missing_store_file_loads_default_settings() {
        let path = temp_store_path("missing");

        let store = load_proxy_store(&path).expect("missing file should produce defaults");

        assert!(store.proxies.is_empty());
        assert_eq!(store.settings.theme, "system");
        assert_eq!(store.settings.language, "system");
        assert_eq!(store.settings.no_proxy, "localhost,127.0.0.1");
        assert!(!store.settings.auto_launch);
    }

    #[test]
    fn saved_store_can_be_loaded_back() {
        let path = temp_store_path("roundtrip");
        let mut store = load_proxy_store(&path).expect("default store should load");
        store
            .proxies
            .push(proxy("http-a", ProxyKind::HttpProxy, true));
        store.settings.no_proxy = "localhost,127.0.0.1,*.local".to_string();

        save_proxy_store(&path, &store).expect("store should save");
        let loaded = load_proxy_store(&path).expect("saved store should load");

        assert_eq!(loaded, store);

        let _ = fs::remove_dir_all(path.parent().unwrap());
    }

    #[test]
    fn enabling_proxy_updates_store_file() {
        let path = temp_store_path("enable");
        let mut store = load_proxy_store(&path).expect("default store should load");
        store.proxies = vec![
            proxy("http-a", ProxyKind::HttpProxy, true),
            proxy("http-b", ProxyKind::HttpProxy, false),
            proxy("all-a", ProxyKind::AllProxy, true),
        ];
        save_proxy_store(&path, &store).expect("store should save before enabling");

        let updated = enable_proxy_in_store(&path, "http-b").expect("proxy should enable");
        let loaded = load_proxy_store(&path).expect("updated store should load");

        assert_eq!(updated, loaded);
        assert!(
            !loaded
                .proxies
                .iter()
                .find(|item| item.id == "http-a")
                .unwrap()
                .enabled
        );
        assert!(
            loaded
                .proxies
                .iter()
                .find(|item| item.id == "http-b")
                .unwrap()
                .enabled
        );
        assert!(
            loaded
                .proxies
                .iter()
                .find(|item| item.id == "all-a")
                .unwrap()
                .enabled
        );

        let _ = fs::remove_dir_all(path.parent().unwrap());
    }
}
