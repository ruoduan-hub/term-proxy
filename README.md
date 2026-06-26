# Term Proxy

Term Proxy is a lightweight Tauri desktop app for managing terminal proxy environment variables across macOS, Linux, and Windows.

It turns shell profile commands such as:

```bash
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
```

into a small desktop UI with saved profiles, one-click enable, import, copy, and settings.

## Features

- Manage `http_proxy`, `https_proxy`, and `ALL_PROXY`.
- Keep multiple saved proxies, with only one enabled proxy per type.
- Generate managed shell scripts under `~/.term-proxy`.
- Install or remove shell profile integration for:
  - macOS/Linux: `.zshrc`, `.bashrc`
  - Windows PowerShell: `~/Documents/PowerShell/Microsoft.PowerShell_profile.ps1`
- Scan existing profile files and import detected proxy values.
- Copy proxy URLs to the system clipboard.
- Toggle app theme: light, dark, or system.
- Toggle app language: Simplified Chinese, English, Japanese, Traditional Chinese, or system.
- Toggle launch at startup with the Tauri autostart plugin.
- Show operation feedback with toast notifications.

System network proxy settings are intentionally out of scope for the MVP. This app manages terminal environment variables through shell profile integration.

## Stack

Project structure follows the official `create-tauri-app` React TypeScript template.

- Tauri 2 / Rust
- React 19
- TypeScript
- Vite
- Tailwind CSS
- i18next / react-i18next
- shadcn/ui conventions
- Sonner

## Development

Install dependencies:

```bash
pnpm install
```

Run the web UI only:

```bash
pnpm dev
```

Run the full Tauri app:

```bash
pnpm tauri:dev
```

Quality checks:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm cargo:fmt
pnpm cargo:test
```

## Packaging

```bash
pnpm tauri:build
```

Tauri builds native packages for the current operating system. Build macOS, Linux, and Windows artifacts on their respective platforms or in matching CI runners.

Prerequisites:

- Node.js 20.19+ or 22.12+ for Vite 7.
- Rust stable toolchain from `rustup`.
- Tauri platform prerequisites for each target OS.

Current local note: the project builds with Node 20.18.0 but Vite prints a version warning. Upgrade Node to remove that warning before release packaging.

## Project Context

Read these files before feature work:

- `PRODUCT.md`
- `DESIGN.md`
- `AGENTS.md`
- `docs/superpowers/specs/2026-06-26-term-proxy-design.md`
