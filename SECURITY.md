# Security Policy

## Supported Versions

Term Proxy is in early development. Security fixes target the latest version on `main`.

## Reporting a Vulnerability

Please do not open a public issue for sensitive security problems.

If you find a vulnerability, report it privately to the project maintainer. Include:

- The affected platform.
- The app version or commit.
- Steps to reproduce.
- Expected and actual behavior.
- Any files or shell profiles involved.

## Security Notes

Term Proxy writes shell integration through controlled marker blocks and managed files under `~/.term-proxy`. Reports related to profile modification, command injection, path handling, or unsafe file writes are especially important.
