use crate::models::app::AppInfo;

pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "Term Proxy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::get_app_info;

    #[test]
    fn returns_app_info_with_name_version_and_platform() {
        let info = get_app_info();

        assert_eq!(info.name, "Term Proxy");
        assert!(!info.version.is_empty());
        assert!(!info.platform.is_empty());
    }
}
