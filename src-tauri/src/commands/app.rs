use crate::models::app::AppInfo;

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    crate::services::app::get_app_info()
}
