# Proxy Copy Command And IPv4 Input Design Spec

Date: 2026-06-27

## Scope

Term Proxy will tighten proxy host input and change the proxy row copy action from copying a raw
proxy URL to copying a platform-appropriate terminal command.

This change stays inside the existing terminal proxy MVP. It does not add system proxy management,
authentication, cloud sync, tray switching, or profile mutation beyond the current managed script
flow.

## Confirmed Requirements

- When adding or editing a proxy, the host field only accepts the IP address part, such as
  `127.0.0.1`.
- The host input allows only digits and dots while typing or pasting.
- Saving still requires a complete valid IPv4 address. Partial or out-of-range values such as
  `1.2.3`, `999.1.1.1`, and `localhost` must not be saved.
- Invalid IPv4 values show an inline form error and do not call the save handler.
- The row copy button copies a terminal command, not the raw proxy URL.
- On macOS and Linux, copied commands use POSIX `export` syntax.
- On Windows, copied commands use PowerShell `$env:` syntax.
- `HTTP_PROXY` rows copy commands for both `http_proxy` and `https_proxy`, using the selected row's
  URL for both variables.
- `ALL_PROXY` rows copy only the `ALL_PROXY` command.
- All visible copy labels, validation text, and success toasts remain internationalized.

## Approach

Use front-end pure helpers for input filtering, IPv4 validation, and copy command formatting.

The React component remains responsible for UI interaction and form feedback. The Tauri clipboard
wrapper remains responsible only for writing text to the clipboard. The Rust script generation
continues to own managed profile script output; it is not changed for this feature.

This keeps the change small and testable without introducing a new IPC command. The command
formatting helper should be isolated so it can move to Rust later if copy commands start requiring
the same escaping complexity as managed scripts.

## Host Input Behavior

The host field is still rendered as a normal text input with `inputMode="decimal"` for mobile and
IME friendliness.

Rules:

- On every input change, remove all characters except `0-9` and `.`.
- Preserve user-entered dots even if the address is incomplete during editing.
- Keep the existing HTML `pattern` as browser-level backup validation.
- On submit, validate with a full IPv4 check where each octet is an integer from 0 to 255.
- If validation fails, keep the form open, focus remains available to the user, and an inline error
  is shown near the host field.
- Successful submit clears the relevant host error.

The filtering is intentionally syntactic. It does not auto-format, auto-pad, or try to infer a valid
IP from arbitrary pasted text because those transformations can surprise users.

## Copy Command Formatting

Build the proxy URL from the selected row:

```text
<scheme>://<host>:<port>
```

For `HTTP_PROXY` rows:

```sh
export http_proxy=http://127.0.0.1:7890; export https_proxy=http://127.0.0.1:7890
```

```powershell
$env:http_proxy="http://127.0.0.1:7890"; $env:https_proxy="http://127.0.0.1:7890"
```

For `ALL_PROXY` rows:

```sh
export ALL_PROXY=http://127.0.0.1:7890
```

```powershell
$env:ALL_PROXY="http://127.0.0.1:7890"
```

The copied command does not wrap POSIX values in extra quotes, matching the requested examples.
This is acceptable for the current MVP because host input is restricted to IPv4, ports are numeric,
and schemes come from the controlled `ProxyScheme` union.

## Platform Selection

Use the platform value already exposed by `get_app_info` where available. Treat `windows` and `win32`
as Windows. Treat all other platforms, including `macos`, `darwin`, and `linux`, as POSIX.

If the app info request fails and the user can still interact with locally available store data,
the copy helper should fall back to POSIX syntax rather than blocking copy.

## UI And Copy Feedback

The copy button remains an icon button in each proxy row. Its accessible label changes from copying
a URL to copying a command.

Success feedback changes from "proxy URL copied" to "proxy command copied". Clipboard failures keep
using the existing error path and toast behavior.

No new visual layout is required. The host validation error should use the existing form styling
language and not introduce a new alert surface.

## Error Handling

Host validation errors are local form errors and do not call Tauri commands or persist data.

Clipboard write failures continue through the current async error handling path:

- set the app-level error message
- show an error toast
- leave stored proxy data unchanged

## Testing

Frontend helper tests should cover:

- host input filtering removes letters, spaces, colons, and URL prefixes while preserving digits and
  dots
- IPv4 validation accepts valid boundary values such as `0.0.0.0` and `255.255.255.255`
- IPv4 validation rejects incomplete, out-of-range, empty, and host-name values
- POSIX copy command formatting for `HTTP_PROXY`
- POSIX copy command formatting for `ALL_PROXY`
- PowerShell copy command formatting for `HTTP_PROXY`
- PowerShell copy command formatting for `ALL_PROXY`

Component and app tests should cover:

- add form host typing or paste filters to digits and dots
- invalid IPv4 submit shows an inline error and does not call `onAddProxy`
- edit form uses the same host filtering and validation
- proxy row copy calls the handler with the selected proxy, not a prebuilt raw URL
- the app copies a POSIX command on non-Windows platforms
- the app copies a PowerShell command on Windows
- copy success toast uses the updated command wording

## Documentation Updates

No README update is required unless the README currently states that the row action copies a raw URL.
If such wording exists, update it to say the row action copies platform-specific terminal commands.

## Acceptance Criteria

- Users cannot type or paste non-digit and non-dot characters into the host field.
- Invalid IPv4 values cannot be saved and produce a visible inline error.
- Copying an `HTTP_PROXY` row copies both `http_proxy` and `https_proxy` commands.
- Copying an `ALL_PROXY` row copies only `ALL_PROXY`.
- macOS and Linux copy POSIX `export` commands.
- Windows copies PowerShell `$env:` commands.
- All changed visible text is covered in Simplified Chinese, English, Japanese, and Traditional
  Chinese locale files.
- Relevant frontend tests pass.
