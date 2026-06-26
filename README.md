# Term Proxy

Term Proxy is a lightweight cross-platform desktop app for managing terminal proxy environment variables.

## Scope

MVP manages shell profile proxy variables only:

- `http_proxy`
- `https_proxy`
- `ALL_PROXY`

System-level proxy changes are intentionally out of scope for the first version.

## Stack

- Tauri 2
- React
- TypeScript
- Vite
- Tailwind CSS
- i18next / react-i18next
- shadcn/ui conventions

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Tauri development also requires Rust and Cargo.

```bash
pnpm tauri dev
```

## Project Context

Read these files before feature work:

- `PRODUCT.md`
- `DESIGN.md`
- `AGENTS.md`
- `docs/superpowers/specs/2026-06-26-term-proxy-design.md`
