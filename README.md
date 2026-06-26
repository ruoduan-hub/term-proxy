# Term Proxy

[简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

Term Proxy is a small, polished desktop app for managing terminal proxy variables across macOS, Linux, and Windows.

It replaces repeated shell edits such as:

```bash
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
```

with a compact UI for saving, switching, and disabling proxy profiles.

<p align="center">
  <img src="./intro/screenshots.png" alt="Term Proxy app screenshot" width="860">
</p>

## Why

Developers often keep several local proxy ports for debugging, company networks, CLI tools, and temporary environments. Maintaining those values by hand in `.zshrc`, `.bashrc`, or PowerShell profiles is easy to forget and hard to audit.

Term Proxy keeps that workflow visible. You add proxy entries once, pick the active entry for each proxy type, and the app writes a managed shell script for new terminal sessions.

The integration is intentionally conservative. Term Proxy does not take over your shell profile. It only adds a small managed loader block, then keeps generated proxy values in its own files under `~/.term-proxy`.

## Features

- Manage `http_proxy`, `https_proxy`, and `ALL_PROXY`.
- Save multiple proxy entries for each type.
- Keep only one active entry per proxy type at a time.
- Configure host and port from the desktop UI, without credentials.
- Manage global `no_proxy` in settings.
- Automatically install shell integration for supported shells.
- Read and merge existing proxy values from shell profiles.
- Copy proxy URLs to the system clipboard.
- Support light theme, dark theme, and system theme.
- Support English, Simplified Chinese, Japanese, and Traditional Chinese.
- Support launch at startup through Tauri autostart.

Term Proxy currently manages terminal proxy environment variables. It does not modify system network proxy settings.

## Shell Integration

Term Proxy uses an extension-style proxy integration.

On macOS and Linux, the app creates:

```text
~/.term-proxy/proxy.sh
```

and adds a controlled loader block to supported shell profiles such as `.zshrc` and `.bashrc`.

On Windows PowerShell, the app creates:

```text
~/.term-proxy/proxy.ps1
```

and loads it from the PowerShell profile.

The shell profile remains yours. The generated proxy content lives in Term Proxy managed files, so enabling or disabling proxy entries rewrites only the managed script.

## Tech Stack

Term Proxy follows the official `create-tauri-app` structure.

- Tauri 2 and Rust
- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui conventions
- i18next and react-i18next
- Sonner

More project notes live in [`docs/`](./docs).

## Development

Install dependencies:

```bash
pnpm install
```

Run the web UI:

```bash
pnpm dev
```

Run the desktop app:

```bash
pnpm tauri:dev
```

Generate app icons:

```bash
pnpm tauri:icon
```

Build the desktop app:

```bash
pnpm tauri:build
```

## Quality Checks

Run the frontend checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Run the Rust checks:

```bash
pnpm cargo:fmt
pnpm cargo:test
```

## Requirements

- Node.js 20.19+ or 22.12+ for Vite 7.
- pnpm.
- Rust stable toolchain from `rustup`.
- Tauri prerequisites for the target operating system.

Tauri packages native apps for the current OS. Build macOS, Linux, and Windows artifacts on matching systems or CI runners.

## Project Documents

- [`docs/PRODUCT.md`](./docs/PRODUCT.md)
- [`DESIGN.md`](./DESIGN.md)
- [`AGENTS.md`](./AGENTS.md)
- [`docs/superpowers/specs/2026-06-26-term-proxy-design.md`](./docs/superpowers/specs/2026-06-26-term-proxy-design.md)

## Inspiration

Term Proxy is inspired by [`cc-switch`](https://github.com/farion1231/cc-switch), especially its Tauri desktop app structure, cross-platform mindset, and developer-tool ergonomics. Term Proxy focuses only on terminal proxy environment management.

## License

MIT. See [`LICENSE`](./LICENSE).
