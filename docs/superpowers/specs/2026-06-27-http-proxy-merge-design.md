# HTTP Proxy Merge Design Spec

Date: 2026-06-27

## Scope

Term Proxy will simplify proxy management by merging the user-facing `http_proxy` and
`https_proxy` categories into one category named `HTTP_PROXY`.

The change keeps backward compatibility with existing app config JSON and imported profile
entries. It does not add system proxy management, authentication, cloud sync, tray switching, or
any non-terminal proxy feature.

## Confirmed Requirements

- The UI shows two proxy categories: `HTTP_PROXY` and `ALL_PROXY`.
- `HTTP_PROXY` represents both shell variables `http_proxy` and `https_proxy`.
- Adding, editing, enabling, disabling, and deleting an `HTTP_PROXY` entry affects both
  `http_proxy` and `https_proxy` in generated shell scripts.
- Existing saved `http_proxy` and `https_proxy` configs are migrated into the new `HTTP_PROXY`
  view.
- Duplicate old configs are removed by semantic key: scheme, host, and port.
- If old `http_proxy` and `https_proxy` values differ, both remain visible under `HTTP_PROXY`,
  but only one can be enabled at a time.
- `ALL_PROXY` remains independent and can still be enabled at the same time as one `HTTP_PROXY`
  config.
- React remains responsible only for UI state, form validation, i18n, and typed Tauri API calls.
- Rust remains responsible for config compatibility, import merging, enable rules, profile
  integration, and script generation.

## Approach

Use a compatibility-preserving logical grouping.

The persisted model may continue to deserialize historical `http_proxy` and `https_proxy` values.
After loading or importing, retained `HTTP_PROXY` entries should be normalized to the existing
`http_proxy` value as the canonical internal representation. Rust helpers still treat
deserialized `http_proxy` and `https_proxy` as the same logical group so older data behaves
correctly before it is saved back.

This avoids a broad breaking migration while giving users the simpler product model immediately.

## Data Model

Frontend:

```ts
type ProxyKind = "http_proxy" | "https_proxy" | "ALL_PROXY";
type ProxyGroup = "HTTP_PROXY" | "ALL_PROXY";
```

`ProxyKind` remains available for compatibility with persisted data and Tauri responses.
`ProxyGroup` is the user-facing grouping used by the dashboard.

Rules:

- `http_proxy` maps to group `HTTP_PROXY`.
- `https_proxy` maps to group `HTTP_PROXY`.
- `ALL_PROXY` maps to group `ALL_PROXY`.
- New entries created from the `HTTP_PROXY` tab use `kind: "http_proxy"` internally.
- Compatibility normalization converts retained `HTTP_PROXY` entries to `kind: "http_proxy"`
  before saving.

Rust:

- Keep `ProxyKind::HttpProxy`, `ProxyKind::HttpsProxy`, and `ProxyKind::AllProxy` deserializable.
- Add or centralize a logical grouping helper equivalent to:
  - `HttpProxy | HttpsProxy => HttpProxyGroup`
  - `AllProxy => AllProxyGroup`
- Use the group helper where product behavior is based on the user-facing category.
- Add a normalization helper that de-duplicates by group, scheme, host, and port, then rewrites
  retained HTTP-group configs to `ProxyKind::HttpProxy`.

## UI Behavior

The proxy dashboard changes from three tabs to two tabs:

- `HTTP_PROXY`
- `ALL_PROXY`

When the selected tab is `HTTP_PROXY`, the list includes configs whose persisted kind is either
`http_proxy` or `https_proxy`, after compatibility de-duplication. Once the store is saved again,
retained HTTP entries use canonical `http_proxy` internally.

The add form does not expose a variable selector. Saving from `HTTP_PROXY` creates one config that
will later write both `http_proxy` and `https_proxy`. Saving from `ALL_PROXY` creates one
`ALL_PROXY` config.

Summary, empty state, aria labels, toasts, and tests must use i18n strings that describe the
logical category, not the old split variables.

## Enable And Disable Rules

Enabling an `HTTP_PROXY` config:

1. Finds the target config by id.
2. Disables every config in the logical `HTTP_PROXY` group, including old `http_proxy` and
   `https_proxy` configs.
3. Enables only the target config.
4. Leaves `ALL_PROXY` enabled state unchanged.
5. Saves the store and regenerates managed shell files.

Disabling an `HTTP_PROXY` config disables only that target config. Since only one entry in the
group can be enabled, this removes both generated `http_proxy` and `https_proxy` exports.

Deleting an enabled `HTTP_PROXY` config removes it from the store and regenerates scripts without
`http_proxy` and `https_proxy`.

## Script Generation

POSIX managed script:

```sh
export http_proxy="http://127.0.0.1:1087"
export https_proxy="http://127.0.0.1:1087"
```

PowerShell managed script:

```powershell
$env:http_proxy = "http://127.0.0.1:1087"
$env:https_proxy = "http://127.0.0.1:1087"
```

`ALL_PROXY` continues to render only `ALL_PROXY`.

The generated scripts should continue to unset/remove `http_proxy`, `https_proxy`, `ALL_PROXY`, and
`no_proxy` before writing current enabled values.

## Import And Compatibility

Startup import scanning continues to recognize:

- `export http_proxy=...`
- `export https_proxy=...`
- `export ALL_PROXY=...`
- `$env:http_proxy = "..."`
- `$env:https_proxy = "..."`
- `$env:ALL_PROXY = "..."`

When merging candidates into the store:

- `http_proxy` and `https_proxy` candidates are compared as `HTTP_PROXY` candidates.
- Duplicates are skipped by group, scheme, host, and port.
- Candidate names for the merged group should prefer `HTTP_PROXY host:port`.
- Existing stored duplicates should be normalized in memory before saving during startup.
- When duplicates exist, keep the enabled entry if exactly one duplicate is enabled; otherwise keep
  the earliest stored or imported entry. Preserve the kept entry's id and timestamps, but use the
  canonical HTTP kind.

The app must not edit, delete, or comment out the user's original profile lines.

## Error Handling

This change does not add new user-facing error types. Existing save, enable, disable, delete, and
script-sync failures continue to surface through the current error/toast paths.

Compatibility normalization should be deterministic and silent. If a malformed stored config cannot
deserialize, the existing load error behavior remains unchanged.

## Testing

Rust tests should cover:

- Enabling an `HTTP_PROXY` config disables both old `http_proxy` and old `https_proxy` siblings.
- Enabling `HTTP_PROXY` leaves `ALL_PROXY` enabled.
- POSIX script generation writes both `http_proxy` and `https_proxy` for one enabled
  `HTTP_PROXY` config.
- PowerShell script generation writes both environment variables for one enabled `HTTP_PROXY`
  config.
- Import merging de-duplicates old `http_proxy` and `https_proxy` candidates with the same
  scheme, host, and port.
- Existing stored duplicates are normalized without losing distinct `HTTP_PROXY` endpoints.

Frontend tests should cover:

- The dashboard renders `HTTP_PROXY` and `ALL_PROXY` tabs only.
- Adding from the `HTTP_PROXY` tab submits the canonical internal `http_proxy` kind.
- Old `https_proxy` configs appear under the `HTTP_PROXY` tab.
- Switching to `ALL_PROXY` still filters independently.
- Copy, edit, delete, enable, disable actions continue to call the existing handlers with the
  selected config id.

Docs and i18n tests or snapshots should be updated where they reference the old three-category
model.

## Documentation Updates

Update product and README wording so the product is described as managing:

- `HTTP_PROXY`, which writes `http_proxy` and `https_proxy` together.
- `ALL_PROXY`, which remains independent.
- global `no_proxy`.

Historical design docs can remain as project history. Current docs should reflect the new
user-facing model.

## Acceptance Criteria

- Users no longer see separate `http_proxy` and `https_proxy` tabs.
- Enabling one `HTTP_PROXY` entry writes both `http_proxy` and `https_proxy` in managed scripts.
- Old saved `http_proxy` and `https_proxy` entries are visible under `HTTP_PROXY`.
- Duplicate old entries with the same scheme, host, and port collapse to one visible/saved entry.
- `ALL_PROXY` behavior remains unchanged.
- Frontend and Rust tests covering the changed behavior pass.
