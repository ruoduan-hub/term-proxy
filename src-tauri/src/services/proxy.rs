use crate::models::proxy::{ProxyConfig, ProxyKind};
use std::{error::Error, fmt};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProxyGroup {
    HttpProxy,
    AllProxy,
}

pub fn proxy_group(kind: ProxyKind) -> ProxyGroup {
    match kind {
        ProxyKind::HttpProxy | ProxyKind::HttpsProxy => ProxyGroup::HttpProxy,
        ProxyKind::AllProxy => ProxyGroup::AllProxy,
    }
}

pub fn normalize_proxy_configs(configs: Vec<ProxyConfig>) -> Vec<ProxyConfig> {
    let mut normalized: Vec<ProxyConfig> = Vec::new();

    for mut config in configs {
        if proxy_group(config.kind) == ProxyGroup::HttpProxy {
            config.kind = ProxyKind::HttpProxy;
        }

        let duplicate_index = normalized.iter().position(|item| {
            proxy_group(item.kind) == proxy_group(config.kind)
                && item.scheme == config.scheme
                && item.host == config.host
                && item.port == config.port
        });

        match duplicate_index {
            Some(index) if config.enabled && !normalized[index].enabled => {
                normalized[index] = config;
            }
            Some(_) => {}
            None => normalized.push(config),
        }
    }

    normalized
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProxyServiceError {
    NotFound,
}

impl fmt::Display for ProxyServiceError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => write!(formatter, "proxy config not found"),
        }
    }
}

impl Error for ProxyServiceError {}

pub fn enable_proxy(
    configs: Vec<ProxyConfig>,
    target_id: &str,
) -> Result<Vec<ProxyConfig>, ProxyServiceError> {
    let target_kind = configs
        .iter()
        .find(|item| item.id == target_id)
        .map(|item| item.kind)
        .ok_or(ProxyServiceError::NotFound)?;

    Ok(configs
        .into_iter()
        .map(|mut item| {
            if proxy_group(item.kind) == proxy_group(target_kind) {
                item.enabled = item.id == target_id;
            }

            item
        })
        .collect())
}

pub fn disable_proxy(
    configs: Vec<ProxyConfig>,
    target_id: &str,
) -> Result<Vec<ProxyConfig>, ProxyServiceError> {
    let has_target = configs.iter().any(|item| item.id == target_id);

    if !has_target {
        return Err(ProxyServiceError::NotFound);
    }

    Ok(configs
        .into_iter()
        .map(|mut item| {
            if item.id == target_id {
                item.enabled = false;
            }

            item
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::proxy::{ProxyKind, ProxyScheme};

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

    trait ProxyTestExt {
        fn with_host(self, host: &str) -> Self;
    }

    impl ProxyTestExt for ProxyConfig {
        fn with_host(mut self, host: &str) -> Self {
            self.host = host.to_string();
            self
        }
    }

    #[test]
    fn enabling_proxy_disables_only_same_logical_group() {
        let configs = vec![
            proxy("http-a", ProxyKind::HttpProxy, true),
            proxy("http-b", ProxyKind::HttpProxy, false),
            proxy("https-a", ProxyKind::HttpsProxy, true),
            proxy("all-a", ProxyKind::AllProxy, true),
        ];

        let next = enable_proxy(configs, "http-b").expect("proxy should exist");

        assert!(
            !next
                .iter()
                .find(|item| item.id == "http-a")
                .unwrap()
                .enabled
        );
        assert!(
            next.iter()
                .find(|item| item.id == "http-b")
                .unwrap()
                .enabled
        );
        assert!(
            !next
                .iter()
                .find(|item| item.id == "https-a")
                .unwrap()
                .enabled
        );
        assert!(next.iter().find(|item| item.id == "all-a").unwrap().enabled);
    }

    #[test]
    fn enabling_http_group_proxy_disables_http_and_https_siblings_only() {
        let configs = vec![
            proxy("http-a", ProxyKind::HttpProxy, true),
            proxy("https-a", ProxyKind::HttpsProxy, true),
            proxy("http-b", ProxyKind::HttpProxy, false),
            proxy("all-a", ProxyKind::AllProxy, true),
        ];

        let next = enable_proxy(configs, "http-b").expect("proxy should exist");

        assert!(
            !next
                .iter()
                .find(|item| item.id == "http-a")
                .unwrap()
                .enabled
        );
        assert!(
            !next
                .iter()
                .find(|item| item.id == "https-a")
                .unwrap()
                .enabled
        );
        assert!(
            next.iter()
                .find(|item| item.id == "http-b")
                .unwrap()
                .enabled
        );
        assert!(next.iter().find(|item| item.id == "all-a").unwrap().enabled);
    }

    #[test]
    fn normalize_proxy_configs_deduplicates_http_group_and_canonicalizes_kind() {
        let configs = vec![
            proxy("http-a", ProxyKind::HttpProxy, false),
            proxy("https-a", ProxyKind::HttpsProxy, true),
            proxy("http-b", ProxyKind::HttpProxy, false).with_host("10.0.0.2"),
            proxy("all-a", ProxyKind::AllProxy, true),
        ];

        let next = normalize_proxy_configs(configs);

        assert_eq!(next.len(), 3);
        let local = next.iter().find(|item| item.host == "127.0.0.1").unwrap();
        assert_eq!(local.id, "https-a");
        assert_eq!(local.kind, ProxyKind::HttpProxy);
        assert!(local.enabled);
        assert_eq!(
            next.iter().find(|item| item.id == "http-b").unwrap().kind,
            ProxyKind::HttpProxy
        );
        assert_eq!(
            next.iter().find(|item| item.id == "all-a").unwrap().kind,
            ProxyKind::AllProxy
        );
    }

    #[test]
    fn enabling_missing_proxy_returns_error() {
        let configs = vec![proxy("http-a", ProxyKind::HttpProxy, true)];

        let result = enable_proxy(configs, "missing");

        assert_eq!(result, Err(ProxyServiceError::NotFound));
    }

    #[test]
    fn disabling_proxy_turns_off_only_target_config() {
        let configs = vec![
            proxy("http-a", ProxyKind::HttpProxy, true),
            proxy("http-b", ProxyKind::HttpProxy, false),
            proxy("https-a", ProxyKind::HttpsProxy, true),
        ];

        let next = disable_proxy(configs, "http-a").expect("proxy should exist");

        assert!(
            !next
                .iter()
                .find(|item| item.id == "http-a")
                .unwrap()
                .enabled
        );
        assert!(
            !next
                .iter()
                .find(|item| item.id == "http-b")
                .unwrap()
                .enabled
        );
        assert!(
            next.iter()
                .find(|item| item.id == "https-a")
                .unwrap()
                .enabled
        );
    }

    #[test]
    fn disabling_missing_proxy_returns_error() {
        let configs = vec![proxy("http-a", ProxyKind::HttpProxy, true)];

        let result = disable_proxy(configs, "missing");

        assert_eq!(result, Err(ProxyServiceError::NotFound));
    }
}
