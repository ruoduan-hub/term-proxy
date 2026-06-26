use crate::models::proxy::ProxyConfig;
use std::{error::Error, fmt};

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
            if item.kind == target_kind {
                item.enabled = item.id == target_id;
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

    #[test]
    fn enabling_proxy_disables_only_same_kind() {
        let configs = vec![
            proxy("http-a", ProxyKind::HttpProxy, true),
            proxy("http-b", ProxyKind::HttpProxy, false),
            proxy("https-a", ProxyKind::HttpsProxy, true),
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
            next.iter()
                .find(|item| item.id == "https-a")
                .unwrap()
                .enabled
        );
    }

    #[test]
    fn enabling_missing_proxy_returns_error() {
        let configs = vec![proxy("http-a", ProxyKind::HttpProxy, true)];

        let result = enable_proxy(configs, "missing");

        assert_eq!(result, Err(ProxyServiceError::NotFound));
    }
}
