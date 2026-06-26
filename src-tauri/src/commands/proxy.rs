use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

use crate::{
    models::proxy::{ProxyImportCandidate, ProxyStore, ShellKind},
    services::proxy::enable_proxy,
    shell::import_scanner::scan_proxy_import_candidates,
    shell::profile::{
        install_profile_marker_file, profile_path_from_home_dir, remove_profile_marker_file,
    },
    storage::managed_files::{managed_proxy_directory_from_home_dir, write_managed_proxy_files},
    storage::proxy_store::{disable_proxy_in_store, load_proxy_store, save_proxy_store},
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
    let mut store = load_proxy_store(&path).map_err(|error| error.to_string())?;
    store.proxies = enable_proxy(store.proxies, &id).map_err(|error| error.to_string())?;
    let home_dir = app
        .path()
        .home_dir()
        .map_err(|error| format!("failed to resolve home directory: {error}"))?;
    let store = install_shell_integrations_from_home_dir(
        &home_dir,
        store,
        &default_auto_shell_integrations(),
    )?;
    save_proxy_store(&path, &store).map_err(|error| error.to_string())?;
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

fn default_auto_shell_integrations() -> Vec<ShellKind> {
    #[cfg(windows)]
    {
        vec![ShellKind::PowerShell]
    }

    #[cfg(not(windows))]
    {
        vec![ShellKind::Zsh, ShellKind::Bash]
    }
}

fn install_shell_integrations_from_home_dir(
    home_dir: &Path,
    mut store: ProxyStore,
    shells: &[ShellKind],
) -> Result<ProxyStore, String> {
    for shell in shells {
        let profile_path = profile_path_from_home_dir(home_dir, *shell);
        install_profile_marker_file(&profile_path, *shell).map_err(|error| error.to_string())?;
        store = with_shell_integration_setting(store, *shell, true);
    }

    Ok(store)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::proxy::ShellKind;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

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

    #[test]
    fn default_auto_shell_integrations_match_current_platform() {
        let shells = default_auto_shell_integrations();

        #[cfg(windows)]
        assert_eq!(shells, vec![ShellKind::PowerShell]);

        #[cfg(not(windows))]
        assert_eq!(shells, vec![ShellKind::Zsh, ShellKind::Bash]);
    }

    #[test]
    fn auto_shell_integration_installs_markers_and_updates_settings() {
        let home_dir = temp_home_dir("auto-shell");
        let store = ProxyStore::default();

        let next = install_shell_integrations_from_home_dir(
            &home_dir,
            store,
            &[ShellKind::Zsh, ShellKind::Bash],
        )
        .expect("shell integrations should install");

        let zshrc = fs::read_to_string(home_dir.join(".zshrc")).expect(".zshrc should exist");
        let bashrc = fs::read_to_string(home_dir.join(".bashrc")).expect(".bashrc should exist");

        assert!(zshrc.contains("# >>> term-proxy initialize >>>"));
        assert!(bashrc.contains("# >>> term-proxy initialize >>>"));
        assert!(next.settings.shell_integration.zsh);
        assert!(next.settings.shell_integration.bash);
        assert!(!next.settings.shell_integration.powershell);

        let _ = fs::remove_dir_all(home_dir);
    }

    fn temp_home_dir(name: &str) -> PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be valid")
            .as_nanos();
        std::env::temp_dir().join(format!("term-proxy-{name}-{suffix}"))
    }
}
