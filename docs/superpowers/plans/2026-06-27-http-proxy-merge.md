# HTTP Proxy Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the user-facing `http_proxy` and `https_proxy` categories into one `HTTP_PROXY` category that writes both shell variables together.

**Architecture:** Keep the existing persisted `ProxyKind` enum for compatibility, but add logical grouping and normalization helpers in Rust and a user-facing group type in React. Rust owns enable rules, import de-duplication, store normalization, and script generation; React owns the two-tab UI and i18n labels.

**Tech Stack:** Tauri 2, Rust, React 19, TypeScript, Vite, Vitest, Testing Library, i18next.

## Global Constraints

- The UI shows only `HTTP_PROXY` and `ALL_PROXY` proxy categories.
- `HTTP_PROXY` writes both `http_proxy` and `https_proxy` in POSIX and PowerShell managed scripts.
- Existing `http_proxy` and `https_proxy` configs remain readable and are normalized to canonical `http_proxy` before saving.
- Duplicate HTTP-group entries are de-duplicated by logical group, scheme, host, and port.
- `ALL_PROXY` remains independent and can be enabled alongside one `HTTP_PROXY` entry.
- React must not handle profile paths, filesystem writes, or shell syntax.
- Rust must handle config compatibility, import merging, enable rules, profile integration, and script generation.
- All visible UI text must use i18n keys in `zh-CN`, `en`, `ja`, and `zh-TW`.

---

### Task 1: Rust Logical Grouping And Store Normalization

**Files:**
- Modify: `src-tauri/src/services/proxy.rs`
- Modify: `src-tauri/src/commands/proxy.rs`
- Test: `src-tauri/src/services/proxy.rs`
- Test: `src-tauri/src/commands/proxy.rs`

**Interfaces:**
- Produces: `ProxyGroup`, `proxy_group(kind: ProxyKind) -> ProxyGroup`
- Produces: `normalize_proxy_configs(configs: Vec<ProxyConfig>) -> Vec<ProxyConfig>`
- Consumes: existing `ProxyConfig`, `ProxyKind`, and `ProxyScheme`

- [ ] **Step 1: Write failing Rust service tests**

Add tests in `src-tauri/src/services/proxy.rs`:

```rust
#[test]
fn enabling_http_group_proxy_disables_http_and_https_siblings_only() {
    let configs = vec![
        proxy("http-a", ProxyKind::HttpProxy, true),
        proxy("https-a", ProxyKind::HttpsProxy, true),
        proxy("http-b", ProxyKind::HttpProxy, false),
        proxy("all-a", ProxyKind::AllProxy, true),
    ];

    let next = enable_proxy(configs, "http-b").expect("proxy should exist");

    assert!(!next.iter().find(|item| item.id == "http-a").unwrap().enabled);
    assert!(!next.iter().find(|item| item.id == "https-a").unwrap().enabled);
    assert!(next.iter().find(|item| item.id == "http-b").unwrap().enabled);
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
```

Update the test helper with a chainable host override:

```rust
trait ProxyTestExt {
    fn with_host(self, host: &str) -> Self;
}

impl ProxyTestExt for ProxyConfig {
    fn with_host(mut self, host: &str) -> Self {
        self.host = host.to_string();
        self
    }
}
```

- [ ] **Step 2: Run service tests and verify red**

Run: `cargo test --manifest-path src-tauri/Cargo.toml services::proxy`

Expected: fails because `normalize_proxy_configs` and logical HTTP grouping are not implemented, or because `HttpsProxy` remains enabled.

- [ ] **Step 3: Implement logical grouping and normalization**

In `src-tauri/src/services/proxy.rs`, add:

```rust
use crate::models::proxy::{ProxyConfig, ProxyKind};

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
            Some(index) if config.enabled && !normalized[index].enabled => normalized[index] = config,
            Some(_) => {}
            None => normalized.push(config),
        }
    }

    normalized
}
```

Update `enable_proxy` to use `proxy_group(item.kind) == proxy_group(target_kind)` instead of direct kind equality.

- [ ] **Step 4: Run service tests and verify green**

Run: `cargo test --manifest-path src-tauri/Cargo.toml services::proxy`

Expected: all `services::proxy` tests pass.

- [ ] **Step 5: Write failing command merge tests**

In `src-tauri/src/commands/proxy.rs`, update `import_candidates_merge_into_store_without_duplicates` so the second candidate is `HttpsProxy` with the same endpoint as an existing `HttpProxy`, and assert it is skipped. Add a distinct HTTP endpoint candidate and assert its imported kind is `HttpProxy` and name starts with `HTTP_PROXY`.

- [ ] **Step 6: Run command tests and verify red**

Run: `cargo test --manifest-path src-tauri/Cargo.toml commands::proxy`

Expected: fails because merge still compares raw kind and keeps old `https_proxy` names.

- [ ] **Step 7: Implement command normalization**

In `src-tauri/src/commands/proxy.rs`:

- import `normalize_proxy_configs` and `proxy_group`.
- normalize `store.proxies` in `get_proxy_store` after loading and after import merge.
- make `merge_import_candidates_into_store` compare `proxy_group(proxy.kind)` to `proxy_group(candidate.kind)`.
- write imported HTTP-group entries with `kind: ProxyKind::HttpProxy`.
- use `HTTP_PROXY {host}:{port}` as imported names for `HttpProxy` and `HttpsProxy` candidates.

- [ ] **Step 8: Run command tests and verify green**

Run: `cargo test --manifest-path src-tauri/Cargo.toml commands::proxy`

Expected: all `commands::proxy` tests pass.

### Task 2: Rust Managed Script Generation

**Files:**
- Modify: `src-tauri/src/shell/script.rs`
- Modify: `src-tauri/src/storage/managed_files.rs`
- Test: `src-tauri/src/shell/script.rs`
- Test: `src-tauri/src/storage/managed_files.rs`

**Interfaces:**
- Consumes: `proxy_group(kind: ProxyKind) -> ProxyGroup`
- Produces: scripts that set `http_proxy` and `https_proxy` for one enabled HTTP-group config

- [ ] **Step 1: Write failing script tests**

Update `posix_script_exports_only_enabled_proxy_variables` to use one enabled `HttpProxy` and assert both:

```rust
assert!(script.contains("export http_proxy=\"http://127.0.0.1:1087\""));
assert!(script.contains("export https_proxy=\"http://127.0.0.1:1087\""));
```

Update `powershell_script_sets_only_enabled_proxy_variables` to assert both:

```rust
assert!(script.contains("$env:http_proxy = \"http://127.0.0.1:1087\""));
assert!(script.contains("$env:https_proxy = \"http://127.0.0.1:1087\""));
```

Update `writes_managed_proxy_scripts` in `src-tauri/src/storage/managed_files.rs` to assert both script files contain both HTTP variables.

- [ ] **Step 2: Run script tests and verify red**

Run: `cargo test --manifest-path src-tauri/Cargo.toml shell::script storage::managed_files`

Expected: fails because `https_proxy` is not written for one enabled `HttpProxy`.

- [ ] **Step 3: Implement script output for logical HTTP group**

In `src-tauri/src/shell/script.rs`, replace the single `env_name(proxy.kind)` export with:

```rust
match proxy_group(proxy.kind) {
    ProxyGroup::HttpProxy => {
        let url = proxy_url(proxy);
        lines.push(format!("export http_proxy=\"{}\"", url));
        lines.push(format!("export https_proxy=\"{}\"", url));
    }
    ProxyGroup::AllProxy => {
        lines.push(format!("export ALL_PROXY=\"{}\"", proxy_url(proxy)));
    }
}
```

For PowerShell use:

```rust
match proxy_group(proxy.kind) {
    ProxyGroup::HttpProxy => {
        let url = powershell_double_quote_value(&proxy_url(proxy));
        lines.push(format!("$env:http_proxy = \"{}\"", url));
        lines.push(format!("$env:https_proxy = \"{}\"", url));
    }
    ProxyGroup::AllProxy => {
        lines.push(format!(
            "$env:ALL_PROXY = \"{}\"",
            powershell_double_quote_value(&proxy_url(proxy))
        ));
    }
}
```

- [ ] **Step 4: Run script tests and verify green**

Run: `cargo test --manifest-path src-tauri/Cargo.toml shell::script storage::managed_files`

Expected: all targeted script and managed-file tests pass.

### Task 3: Frontend Proxy Group UI

**Files:**
- Modify: `src/shared/types/proxy.ts`
- Modify: `src/features/proxies/ProxyDashboard.tsx`
- Modify: `src/features/proxies/ProxyDashboard.test.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Produces: `type ProxyGroup = "HTTP_PROXY" | "ALL_PROXY"`
- Produces: `proxyGroupForKind(kind: ProxyKind): ProxyGroup`
- Consumes: existing `NewProxyConfig` and `ProxyConfig`

- [ ] **Step 1: Write failing dashboard tests**

Update `ProxyDashboard.test.tsx` to assert:

```ts
expect(screen.getByRole("tab", { name: "HTTP_PROXY" })).toBeInTheDocument();
expect(screen.queryByRole("tab", { name: "http_proxy" })).not.toBeInTheDocument();
expect(screen.queryByRole("tab", { name: "https_proxy" })).not.toBeInTheDocument();
expect(screen.getByRole("tab", { name: "ALL_PROXY" })).toBeInTheDocument();
```

Add a test where a config with `kind: "https_proxy"` appears in the default `HTTP_PROXY` tab.

Update the add-form test so the default `HTTP_PROXY` tab submits `kind: "http_proxy"` and switching to `ALL_PROXY` submits `kind: "ALL_PROXY"`.

- [ ] **Step 2: Run dashboard tests and verify red**

Run: `pnpm test src/features/proxies/ProxyDashboard.test.tsx`

Expected: fails because the dashboard still renders three raw proxy-kind tabs.

- [ ] **Step 3: Implement proxy group UI**

In `src/shared/types/proxy.ts`, add:

```ts
export type ProxyGroup = "HTTP_PROXY" | "ALL_PROXY";
```

In `src/features/proxies/ProxyDashboard.tsx`:

```ts
const proxyGroups = [
  { key: "http", value: "HTTP_PROXY" },
  { key: "all", value: "ALL_PROXY" },
] as const;

function proxyGroupForKind(kind: ProxyKind): ProxyGroup {
  return kind === "ALL_PROXY" ? "ALL_PROXY" : "HTTP_PROXY";
}

function kindForProxyGroup(group: ProxyGroup): ProxyKind {
  return group === "ALL_PROXY" ? "ALL_PROXY" : "http_proxy";
}
```

Change selected state to `useState<ProxyGroup>("HTTP_PROXY")`, filter by `proxyGroupForKind(proxy.kind)`, and submit `kind: kindForProxyGroup(selectedGroup)`.

- [ ] **Step 4: Run dashboard tests and verify green**

Run: `pnpm test src/features/proxies/ProxyDashboard.test.tsx`

Expected: all dashboard tests pass.

- [ ] **Step 5: Update app tests for new labels**

Update `src/App.test.tsx` expectations from raw `http_proxy` / `https_proxy` tabs to `HTTP_PROXY` and from saved behavior to canonical `kind: "http_proxy"`.

- [ ] **Step 6: Run app tests and verify green**

Run: `pnpm test src/App.test.tsx`

Expected: all app tests pass.

### Task 4: i18n And Documentation

**Files:**
- Modify: `src/shared/i18n/locales/en.json`
- Modify: `src/shared/i18n/locales/zh-CN.json`
- Modify: `src/shared/i18n/locales/ja.json`
- Modify: `src/shared/i18n/locales/zh-TW.json`
- Modify: `docs/PRODUCT.md`
- Modify: `docs/DESIGN.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `README.ja.md`

**Interfaces:**
- Consumes: `proxy.kind.http` and `proxy.kind.all` keys
- Removes UI dependency on `proxy.kind.https`

- [ ] **Step 1: Update locale labels**

Change `proxy.kind` in all four locale files to:

```json
"kind": {
  "http": "HTTP_PROXY",
  "all": "ALL_PROXY"
}
```

- [ ] **Step 2: Update current docs**

Update current docs and READMEs to describe:

- `HTTP_PROXY` writes `http_proxy` and `https_proxy` together.
- `ALL_PROXY` remains independent.
- global `no_proxy` remains unchanged.

- [ ] **Step 3: Search for stale current references**

Run: `rg -n "https_proxy.*ALL_PROXY|http_proxy.*https_proxy.*ALL_PROXY|proxy\\.kind\\.https|\"https\"" src README.md README.zh-CN.md README.ja.md docs/PRODUCT.md docs/DESIGN.md`

Expected: no stale current UI/documentation references to separate `https_proxy` management remain. Historical specs may still contain old scope.

### Task 5: Full Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run frontend typecheck**

Run: `pnpm typecheck`

Expected: exits 0.

- [ ] **Step 2: Run frontend tests**

Run: `pnpm test`

Expected: exits 0.

- [ ] **Step 3: Run frontend build**

Run: `pnpm build`

Expected: exits 0.

- [ ] **Step 4: Run Rust format check**

Run: `cargo fmt --manifest-path src-tauri/Cargo.toml --check`

Expected: exits 0.

- [ ] **Step 5: Run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: exits 0.

- [ ] **Step 6: Review diff and commit**

Run: `git diff --stat` and `git diff --check`.

Expected: no whitespace errors. Commit with:

```bash
git add -A
git commit -m "feat: merge http proxy settings"
```
