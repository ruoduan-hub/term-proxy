<div align="center">
  <img src="./app-icon.png" alt="Term Proxy" width="96">

  <h1>Term Proxy</h1>

  <p><strong>A small, polished desktop app for managing terminal proxy variables.</strong></p>
  <p>Save, switch, and disable terminal proxies without hand-editing shell profiles.</p>

  <p>
    <a href="https://github.com/ruoduan-hub/term-proxy/releases"><img src="https://img.shields.io/github/v/release/ruoduan-hub/term-proxy?color=111827&label=version" alt="Version"></a>
    <a href="https://github.com/ruoduan-hub/term-proxy/releases"><img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform"></a>
    <a href="https://tauri.app/"><img src="https://img.shields.io/badge/built%20with-Tauri%202-24C8DB.svg" alt="Built with Tauri 2"></a>
    <a href="https://github.com/ruoduan-hub/term-proxy/releases/latest"><img src="https://img.shields.io/github/downloads/ruoduan-hub/term-proxy/total?color=0f766e&label=downloads" alt="Downloads"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/github/license/ruoduan-hub/term-proxy?color=111827" alt="License"></a>
  </p>

  <p>
    English · <a href="./README.zh-CN.md">简体中文</a> · <a href="./README.ja.md">日本語</a>
  </p>
</div>

Term Proxy replaces repeated shell edits such as:

```bash
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
```

with a compact UI for saving, switching, and disabling proxy profiles. In the app, `HTTP_PROXY`
is one setting that writes both `http_proxy` and `https_proxy`.

<p align="center">
  <img src="./intro/screenshots.png" alt="Term Proxy app screenshot" width="860">
</p>

## Download

Download the latest build from [GitHub Releases](https://github.com/ruoduan-hub/term-proxy/releases/latest).

| Platform | Recommended package |
| --- | --- |
| macOS | `Term.Proxy_1.0.0_universal.dmg` |
| Windows | `Term.Proxy_1.0.0_x64-setup.exe` or `Term.Proxy_1.0.0_x64_en-US.msi` |
| Linux | `Term.Proxy_1.0.0_amd64.AppImage`, `.deb`, or `.rpm` |

macOS builds are not code-signed yet. If macOS blocks the app on first launch, open it from Finder once through the context menu. If the app is still blocked, remove the quarantine attribute:

```bash
xattr -dr com.apple.quarantine "/Applications/Term Proxy.app"
```

## Why

Developers often keep several local proxy ports for debugging, company networks, CLI tools, and temporary environments. Maintaining those values by hand in `.zshrc`, `.bashrc`, or PowerShell profiles is easy to forget and hard to audit.

Term Proxy keeps that workflow visible. You add proxy entries once, pick the active `HTTP_PROXY`
entry and optional `ALL_PROXY` entry, and the app writes a managed shell script for new terminal
sessions.

The integration is intentionally conservative. Term Proxy does not take over your shell profile. It only adds a small managed loader block, then keeps generated proxy values in its own files under `~/.term-proxy`.

## Features

- Manage `HTTP_PROXY`, `ALL_PROXY`, and global `no_proxy`.
- Write `http_proxy` and `https_proxy` together from one `HTTP_PROXY` setting.
- Save multiple proxy entries for each type.
- Keep only one active entry per type at a time, while allowing `HTTP_PROXY` and `ALL_PROXY` to run together.
- Configure host and port from the desktop UI, without credentials.
- Manage global `no_proxy` in settings.
- Automatically install shell integration for supported shells.
- Read and merge existing proxy values from shell profiles.
- Copy platform-specific terminal proxy commands to the system clipboard.
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

## Release Builds

GitHub Actions builds downloadable packages for macOS, Windows, and Linux.

Maintainers can create a draft GitHub Release by pushing a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The same workflow can also be started manually from GitHub Actions through the `Release` workflow. Generated releases are drafts by default, so assets can be checked before publishing.

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

## FAQ

<details>
<summary><strong>Does Term Proxy modify system network proxy settings?</strong></summary>

No. Term Proxy manages terminal environment variables only. It does not change the operating system network proxy.

</details>

<details>
<summary><strong>Why does an existing terminal not update immediately?</strong></summary>

Environment variables are loaded when a terminal session starts. After changing a proxy in Term Proxy, open a new terminal session to use the latest values.

</details>

<details>
<summary><strong>Where are generated proxy scripts stored?</strong></summary>

Term Proxy stores managed scripts under `~/.term-proxy`. Shell profiles only load those managed scripts through a controlled block.

</details>

## License

MIT. See [`LICENSE`](./LICENSE).
