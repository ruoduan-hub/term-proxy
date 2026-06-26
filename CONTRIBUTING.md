# Contributing

Thanks for taking the time to improve Term Proxy.

## Development Setup

Install dependencies:

```bash
pnpm install
```

Run the desktop app:

```bash
pnpm tauri:dev
```

## Before Sending Changes

Run the checks that match your change:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm cargo:fmt
pnpm cargo:test
```

For UI changes, verify the app in both light and dark themes and check English, Simplified Chinese, and Japanese text lengths.

## Pull Request Guidelines

- Keep changes focused on one topic.
- Use Conventional Commits, for example `feat: add proxy import` or `fix: preserve shell profile content`.
- Do not commit generated build artifacts.
- Do not add credentials, tokens, private endpoints, or local machine paths.
- Explain profile or filesystem changes clearly. This app touches shell startup files, so safety and reversibility matter.

## Project Boundaries

Term Proxy currently manages terminal proxy environment variables only. System network proxy settings are intentionally outside the current scope.
