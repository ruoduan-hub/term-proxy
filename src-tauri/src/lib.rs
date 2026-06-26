mod commands;
mod models;
mod services;
mod shell;
mod storage;

use tauri_plugin_autostart::MacosLauncher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_info,
            commands::proxy::get_proxy_store,
            commands::proxy::scan_proxy_imports,
            commands::proxy::save_proxy_store_command,
            commands::proxy::enable_proxy_config,
            commands::proxy::install_shell_integration,
            commands::proxy::remove_shell_integration
        ])
        .run(tauri::generate_context!())
        .expect("error while running Term Proxy");
}
