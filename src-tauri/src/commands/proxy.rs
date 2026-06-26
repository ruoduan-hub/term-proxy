use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

use crate::{
    models::proxy::{ProxyImportCandidate, ProxyStore, ShellKind},
    shell::import_scanner::scan_proxy_import_candidates,
    shell::profile::{
        install_profile_marker_file, profile_path_from_home_dir, remove_profile_marker_file,
    },
    storage::managed_files::{managed_proxy_directory_from_home_dir, write_managed_proxy_files},
    storage::proxy_store::{
        disable_proxy_in_store, enable_proxy_in_store, load_proxy_store, save_proxy_store,
    },
};

const STORE_FILE_NAME: &str = "proxy-store.json";

#[tauri::command]
pub fn get_proxy_store(app: AppHandle) -> Result<ProxyStore, String> {
    let path = proxy_store_path(&app)?;
    load_proxy_store(&path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn scan_proxy_imports(app: AppHandle) -> Result<Vec<ProxyImportCandidate>, String> {
    let home_dir = app
        .path()
        .home_dir()
        .map_err(|error| format!("failed to resolve home directory: {error}"))?;

    scan_proxy_import_candidates(&home_dir).map_err(|error| error.to_string())
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

#[tauri::command]
pub fn disable_proxy_config(app: AppHandle, id: String) -> Result<ProxyStore, String> {
    let path = proxy_store_path(&app)?;
    let store = disable_proxy_in_store(&path, &id).map_err(|error| error.to_string())?;
    sync_managed_proxy_files(&app, &store)?;
    Ok(store)
}

#[tauri::command]
pub fn install_shell_integration(app: AppHandle, shell: ShellKind) -> Result<ProxyStore, String> {
    let profile_path = shell_profile_path(&app, shell)?;
    install_profile_marker_file(&profile_path, shell).map_err(|error| error.to_string())?;

    let store_path = proxy_store_path(&app)?;
    let store = load_proxy_store(&store_path).map_err(|error| error.to_string())?;
    let store = with_shell_integration_setting(store, shell, true);
    save_proxy_store(&store_path, &store).map_err(|error| error.to_string())?;
    sync_managed_proxy_files(&app, &store)?;
    Ok(store)
}

#[tauri::command]
pub fn remove_shell_integration(app: AppHandle, shell: ShellKind) -> Result<ProxyStore, String> {
    let profile_path = shell_profile_path(&app, shell)?;
    remove_profile_marker_file(&profile_path).map_err(|error| error.to_string())?;

    let store_path = proxy_store_path(&app)?;
    let store = load_proxy_store(&store_path).map_err(|error| error.to_string())?;
    let store = with_shell_integration_setting(store, shell, false);
    save_proxy_store(&store_path, &store).map_err(|error| error.to_string())?;
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

fn shell_profile_path(app: &AppHandle, shell: ShellKind) -> Result<PathBuf, String> {
    let home_dir = app
        .path()
        .home_dir()
        .map_err(|error| format!("failed to resolve home directory: {error}"))?;
    Ok(profile_path_from_home_dir(&home_dir, shell))
}

fn sync_managed_proxy_files(app: &AppHandle, store: &ProxyStore) -> Result<(), String> {
    let directory = managed_proxy_directory(app)?;
    write_managed_proxy_files(&directory, store)
        .map(|_| ())
        .map_err(|error| error.to_string())
}

fn with_shell_integration_setting(
    mut store: ProxyStore,
    shell: ShellKind,
    enabled: bool,
) -> ProxyStore {
    match shell {
        ShellKind::Zsh => store.settings.shell_integration.zsh = enabled,
        ShellKind::Bash => store.settings.shell_integration.bash = enabled,
        ShellKind::PowerShell => store.settings.shell_integration.powershell = enabled,
    }

    store
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::proxy::ShellKind;

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

    #[test]
    fn shell_integration_setting_updates_requested_shell_only() {
        let mut store = ProxyStore::default();
        store.settings.shell_integration.bash = true;

        let next = with_shell_integration_setting(store, ShellKind::Zsh, true);

        assert!(next.settings.shell_integration.zsh);
        assert!(next.settings.shell_integration.bash);
        assert!(!next.settings.shell_integration.powershell);
    }

    #[test]
    fn shell_integration_setting_can_disable_requested_shell() {
        let mut store = ProxyStore::default();
        store.settings.shell_integration.zsh = true;
        store.settings.shell_integration.bash = true;

        let next = with_shell_integration_setting(store, ShellKind::Zsh, false);

        assert!(!next.settings.shell_integration.zsh);
        assert!(next.settings.shell_integration.bash);
    }
}
