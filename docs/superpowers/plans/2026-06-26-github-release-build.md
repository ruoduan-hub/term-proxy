# GitHub Release Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions release workflow that builds Term Proxy native installers and uploads them to GitHub Releases.

**Architecture:** Use `tauri-apps/tauri-action@v1` in a matrix workflow across macOS, Windows, and Linux. Keep release creation inside the official Tauri action and document tag/manual trigger usage in the three README files.

**Tech Stack:** GitHub Actions, Tauri 2, pnpm, Node.js 22, Rust stable.

## Global Constraints

- Release workflow path is `.github/workflows/release.yml`.
- Trigger on `workflow_dispatch` and `push` tags matching `v*`.
- Use draft releases by default.
- Do not add signing or notarization secrets in this task.
- Document release usage in English, Simplified Chinese, and Japanese README files.

---

### Task 1: Release Workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `pnpm install`, `pnpm tauri:build`, `src-tauri/tauri.conf.json`
- Produces: GitHub Release assets uploaded by `tauri-apps/tauri-action@v1`

- [ ] **Step 1: Create workflow file**

Create `.github/workflows/release.yml` with a matrix for macOS Apple Silicon, macOS Intel, Windows, and Ubuntu. Use `contents: write`, Node.js 22, pnpm, Rust stable, Rust cache, Ubuntu Tauri dependencies, and `tauri-apps/tauri-action@v1`.

- [ ] **Step 2: Verify YAML syntax by reading the file**

Run: `sed -n '1,260p' .github/workflows/release.yml`

Expected: workflow contains `workflow_dispatch`, `tags: ["v*"]`, `contents: write`, all four matrix entries, and `releaseDraft: true`.

### Task 2: README Release Documentation

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `README.ja.md`

**Interfaces:**
- Consumes: `.github/workflows/release.yml`
- Produces: user-facing release instructions

- [ ] **Step 1: Add release instructions to all README files**

Add a short section after the packaging/build command explaining that maintainers can push a `v*` tag or run the Release workflow manually. Mention that generated GitHub Releases are drafts.

- [ ] **Step 2: Verify text exists**

Run: `rg -n "Release|发布|リリース|workflow_dispatch|v0.1.0" README.md README.zh-CN.md README.ja.md`

Expected: each README contains its localized release section.

### Task 3: Verification and Commit

**Files:**
- Verify all files changed by Tasks 1-2.

**Interfaces:**
- Consumes: workflow and README changes
- Produces: committed release workflow

- [ ] **Step 1: Run local checks**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Expected: all commands pass. `pnpm build` may print the existing Node `20.18.0` warning locally, but must still complete.

- [ ] **Step 2: Commit**

Run:

```bash
git add .github/workflows/release.yml README.md README.zh-CN.md README.ja.md docs/superpowers/specs/2026-06-26-github-release-build-design.md docs/superpowers/plans/2026-06-26-github-release-build.md
git commit -m "ci: add release build workflow"
```
