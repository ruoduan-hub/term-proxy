use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProxyKind {
    HttpProxy,
    HttpsProxy,
    #[serde(rename = "ALL_PROXY")]
    AllProxy,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProxyScheme {
    Http,
    Https,
    Socks4,
    Socks5,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ShellKind {
    Zsh,
    Bash,
    #[serde(rename = "powershell")]
    PowerShell,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProxyConfig {
    pub id: String,
    pub name: String,
    pub kind: ProxyKind,
    pub scheme: ProxyScheme,
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ShellIntegrationSettings {
    pub zsh: bool,
    pub bash: bool,
    pub powershell: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub auto_launch: bool,
    pub no_proxy: String,
    pub shell_integration: ShellIntegrationSettings,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProxyStore {
    pub proxies: Vec<ProxyConfig>,
    pub settings: AppSettings,
}

impl Default for ShellIntegrationSettings {
    fn default() -> Self {
        Self {
            zsh: false,
            bash: false,
            powershell: false,
        }
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: "system".to_string(),
            auto_launch: false,
            no_proxy: "localhost,127.0.0.1".to_string(),
            shell_integration: ShellIntegrationSettings::default(),
        }
    }
}

impl Default for ProxyStore {
    fn default() -> Self {
        Self {
            proxies: Vec::new(),
            settings: AppSettings::default(),
        }
    }
}
