use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

use crate::{
    models::proxy::ProxyStore,
    storage::managed_files::{managed_proxy_directory_from_home_dir, write_managed_proxy_files},
    storage::proxy_store::{enable_proxy_in_store, load_proxy_store, save_proxy_store},
};

const STORE_FILE_NAME: &str = "proxy-store.json";

#[tauri::command]
pub fn get_proxy_store(app: AppHandle) -> Result<ProxyStore, String> {
    let path = proxy_store_path(&app)?;
    load_proxy_store(&path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_proxy_store_command(app: AppHandle, store: ProxyStore) -> Result<ProxyStore, String> {
    let path = proxy_store_path(&app)?;
    save_proxy_store(&path, &store).map_err(|error| error.to_string())?;
    sync_managed_proxy_files(&app, &store)?;
    Ok(store)
}

#[tauri::command]
pub fn enable_proxy_config(app: AppHandle, id: String) -> Result<ProxyStore, String> {
    let path = proxy_store_path(&app)?;
    let store = enable_proxy_in_store(&path, &id).map_err(|error| error.to_string())?;
    sync_managed_proxy_files(&app, &store)?;
    Ok(store)
}

fn proxy_store_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("failed to resolve app config directory: {error}"))?;
    Ok(proxy_store_path_from_app_config_dir(&app_config_dir))
}

fn proxy_store_path_from_app_config_dir(app_config_dir: &Path) -> PathBuf {
    app_config_dir.join(STORE_FILE_NAME)
}

fn managed_proxy_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let home_dir = app
        .path()
        .home_dir()
        .map_err(|error| format!("failed to resolve home directory: {error}"))?;
    Ok(managed_proxy_directory_from_home_dir(&home_dir))
}

fn sync_managed_proxy_files(app: &AppHandle, store: &ProxyStore) -> Result<(), String> {
    let directory = managed_proxy_directory(app)?;
    write_managed_proxy_files(&directory, store)
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn proxy_store_path_uses_app_config_directory() {
        let app_config_dir = PathBuf::from("/tmp/term-proxy-config");

        let path = proxy_store_path_from_app_config_dir(&app_config_dir);

        assert_eq!(path, app_config_dir.join("proxy-store.json"));
    }

    #[test]
    fn managed_proxy_path_uses_home_term_proxy_directory() {
        let home_dir = PathBuf::from("/Users/example");

        let path = managed_proxy_directory_from_home_dir(&home_dir);

        assert_eq!(path, home_dir.join(".term-proxy"));
    }
}
