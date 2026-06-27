# Task 2 Report: Enforce IPv4 Host Input In ProxyDashboard

Status: DONE_WITH_CONCERNS

## Summary

Implemented IPv4-only host input handling in `ProxyDashboard`:

- Added controlled add/edit host state.
- Sanitized host input to digits and dots with `sanitizeHostInput`.
- Blocked invalid IPv4 submissions with `isValidIpv4Address`.
- Added inline localized host validation errors.
- Added `noValidate` to add/edit forms so React validation is shown before browser native validation.
- Replaced local proxy URL/group helpers with `formatProxyUrl` and `proxyGroupForKind`.
- Renamed the dashboard copy callback prop to `onCopyProxyCommand` and pass the selected `ProxyConfig`.
- Added `hostIpv4Error` to `en`, `zh-CN`, `ja`, and `zh-TW` locale files.

## TDD Evidence

Red step:

- Added the three required component tests in `src/features/proxies/ProxyDashboard.test.tsx`.
- Updated dashboard test render calls from `onCopyProxyUrl` to `onCopyProxyCommand`.
- Ran `pnpm test src/features/proxies/ProxyDashboard.test.tsx`.
- Result: FAIL as expected.
- Expected failures observed:
  - Add form host input was not filtered.
  - Invalid add form IPv4 host did not show inline error.
  - Edit form host input was not filtered.
  - Copy callback still used the old `onCopyProxyUrl` prop.

Green step:

- Implemented the dashboard behavior and locale key updates.
- Re-ran `pnpm test src/features/proxies/ProxyDashboard.test.tsx`.
- Result: PASS, 14 tests passed.

## Verification

Command run:

```bash
pnpm test src/features/proxies/ProxyDashboard.test.tsx
```

Final result:

```text
Test Files  1 passed (1)
Tests       14 passed (14)
```

## Commit

- `b1955df feat: enforce ipv4 proxy hosts`

## Concerns

- `src/App.tsx` still passes the old `onCopyProxyUrl` prop to `ProxyDashboard`. The task brief explicitly scoped ownership and the requested commit to `ProxyDashboard.tsx`, `ProxyDashboard.test.tsx`, and the locale files, so `App.tsx` was not modified.
- Pre-existing unrelated `AGENTS.md` worktree changes were left untouched.

---

## Review Fix: Preserve Non-Host Form Validation After noValidate

Status: DONE

Fixed the reviewed validation gap in `src/features/proxies/ProxyDashboard.tsx`:

- Kept `noValidate` so invalid IPv4 hosts still show the inline React error.
- Added explicit `form.checkValidity()` / `form.reportValidity()` checks after the custom host validation and before invoking add/edit submit callbacks.
- Added focused tests proving valid IPv4 hosts cannot bypass empty name, empty port, or out-of-range port constraints in add and edit forms.

Verification command:

```bash
pnpm test src/features/proxies/ProxyDashboard.test.tsx
```

Output summary:

```text
Test Files  1 passed (1)
Tests       20 passed (20)
```

Concerns:

- Pre-existing unrelated `AGENTS.md` worktree changes were left untouched.
