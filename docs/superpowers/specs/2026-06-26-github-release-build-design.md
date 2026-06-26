# GitHub Release Build Design

Date: 2026-06-26

## Goal

Add a GitHub Actions release workflow that builds Term Proxy for macOS, Windows, and Linux, then uploads native installers to GitHub Releases for users to download.

## Scope

- Create a release workflow under `.github/workflows/release.yml`.
- Support manual runs through `workflow_dispatch`.
- Support version tags matching `v*`, for example `v0.1.0`.
- Build macOS Intel, macOS Apple Silicon, Windows, and Linux packages.
- Upload generated Tauri bundles to GitHub Releases.
- Keep releases as drafts by default so the maintainer can inspect assets before publishing.
- Document the release flow in all three README files.

## Architecture

The workflow uses `tauri-apps/tauri-action@v1`, which builds Tauri apps and can create or update GitHub Releases with generated bundles. Each platform runs in a matrix job so the correct native bundle is built on the matching GitHub-hosted runner.

The workflow grants `contents: write` because creating releases and uploading release assets require write access through `GITHUB_TOKEN`.

## Triggers

- `workflow_dispatch`: allows the maintainer to run the workflow from the GitHub Actions UI.
- `push.tags: ["v*"]`: builds and publishes a draft release when a version tag is pushed.

## Platform Matrix

- `macos-latest` with `--target aarch64-apple-darwin`
- `macos-latest` with `--target x86_64-apple-darwin`
- `windows-latest`
- `ubuntu-22.04`

## Dependencies

- Node.js `22`
- pnpm through `pnpm/action-setup@v4`
- Rust stable through `dtolnay/rust-toolchain@stable`
- Rust cache through `swatinem/rust-cache@v2`
- Ubuntu Tauri dependencies: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `patchelf`

## Release Naming

- Tag: the pushed tag name when available, otherwise `app-v__VERSION__`.
- Release name: `Term Proxy v__VERSION__`.
- Release body: short download note.
- Draft: `true`.
- Prerelease: `false`.

## Verification

- Run local TypeScript checks.
- Run local frontend tests.
- Run local production build.
- Validate workflow YAML shape by inspection.
