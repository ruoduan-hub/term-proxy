# Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Term Proxy repository as a Tauri + React + Vite desktop app with project docs, typed frontend conventions, i18n/theme scaffolding, and a minimal Tauri command boundary ready for proxy features.

**Architecture:** Use Tauri 2 with React + TypeScript + Vite. Keep frontend UI and typed Tauri API wrappers separate from Rust commands/services so later proxy/profile logic can live in Rust adapters. This plan builds only the foundation; proxy CRUD/profile writing will be planned separately.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Tailwind CSS, shadcn/ui conventions, i18next, react-i18next, Vitest, Rust/Tauri commands.

## Global Constraints

- MVP manages terminal Shell proxy variables only; it must not modify system-level network proxy settings.
- Proxy kinds are exactly `http_proxy`, `https_proxy`, and `ALL_PROXY`.
- First supported shells are zsh, bash, and PowerShell, with adapter structure reserved for fish, nu, and cmd.
- UI must be minimalist, refined product UI using shadcn/ui on demand, not default template styling.
- All visible frontend text must go through i18next translation keys.
- React must not directly read/write user profile files; filesystem/profile work belongs in Rust/Tauri.
- Cross-platform code must account for macOS, Linux, and Windows path/profile differences.
- Important cross-platform/profile logic comments should be Chinese and explain why.
- Use `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, and `docs/superpowers/specs/2026-06-26-term-proxy-design.md` as binding project context.

---

## File Structure

Create or keep these files during foundation work:

- `package.json`: frontend scripts and dependencies.
- `pnpm-lock.yaml`: dependency lockfile.
- `index.html`: Vite entry.
- `vite.config.ts`: Vite + React + Vitest config.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript config.
- `src/main.tsx`: React entry.
- `src/app/App.tsx`: top-level app shell.
- `src/app/App.test.tsx`: app smoke tests.
- `src/app/styles.css`: theme tokens, Tailwind layers, base layout.
- `src/features/proxies/ProxyDashboard.tsx`: initial proxy dashboard UI shell.
- `src/features/settings/SettingsPanel.tsx`: initial settings UI shell.
- `src/features/import/ImportNotice.tsx`: initial import notice UI shell.
- `src/shared/i18n/index.ts`: i18next setup.
- `src/shared/i18n/locales/zh-CN.json`, `en.json`, `ja.json`, `zh-TW.json`: translations.
- `src/shared/tauri/api.ts`: typed Tauri command wrapper.
- `src/shared/types/proxy.ts`: shared frontend proxy/settings types.
- `src/shared/ui/button.tsx`, `src/shared/ui/card.tsx`, `src/shared/ui/switch.tsx`, `src/shared/ui/tabs.tsx`: minimal shadcn-style local components until shadcn CLI is configured.
- `src/shared/lib/cn.ts`: class name helper.
- `src-tauri/Cargo.toml`: Rust crate dependencies.
- `src-tauri/tauri.conf.json`: Tauri app config.
- `src-tauri/src/main.rs`: Tauri entry.
- `src-tauri/src/commands/mod.rs`: command module root.
- `src-tauri/src/commands/app.rs`: initial app info command.
- `src-tauri/src/services/mod.rs`: service module root.
- `src-tauri/src/services/app.rs`: app info service.
- `src-tauri/src/models/mod.rs`: model module root.
- `src-tauri/src/models/app.rs`: serializable app info model.
- `.gitignore`: generated files and platform artifacts.
- `.npmrc`: pnpm behavior.
- `README.md`: project overview and commands.

## Task 1: Repository Baseline

**Files:**
- Modify: `.git`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `README.md`

**Interfaces:**
- Consumes: existing docs from `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`.
- Produces: repository baseline with ignored generated files and documented commands.

- [ ] **Step 1: Rename default branch to main**

Run:

```bash
git branch -m main
```

Expected: exit code 0.

- [ ] **Step 2: Add ignore rules**

Create `.gitignore` with:

```gitignore
node_modules/
dist/
dist-ssr/
coverage/
.DS_Store
*.log

src-tauri/target/
src-tauri/gen/
src-tauri/.tauri/

.env
.env.*
!.env.example
```

- [ ] **Step 3: Add pnpm config**

Create `.npmrc` with:

```ini
package-manager-strict=false
auto-install-peers=true
```

- [ ] **Step 4: Add README**

Create `README.md` with:

```markdown
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
```

- [ ] **Step 5: Verify baseline files**

Run:

```bash
ls -la .gitignore .npmrc README.md
```

Expected: all three files are listed.

- [ ] **Step 6: Commit baseline**

Run:

```bash
git add .gitignore .npmrc README.md PRODUCT.md DESIGN.md AGENTS.md docs/superpowers/specs/2026-06-26-term-proxy-design.md docs/superpowers/plans/2026-06-26-project-foundation.md
git commit -m "docs: define term proxy foundation"
```

Expected: commit succeeds.

## Task 2: Frontend Vite Foundation

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/app/styles.css`

**Interfaces:**
- Consumes: pnpm, Node.js.
- Produces: React app shell with test/build scripts.

- [ ] **Step 1: Create package manifest**

Create `package.json` with:

```json
{
  "name": "term-proxy",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "i18next": "^23.16.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.1.4"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` is created and dependencies install without errors.

- [ ] **Step 3: Add Vite entry**

Create `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Term Proxy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Add TypeScript config**

Create `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json` with:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Add Vite config**

Create `vite.config.ts` with:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 6: Add failing app smoke test**

Create `src/app/App.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the product shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Term Proxy" })).toBeInTheDocument();
    expect(screen.getByText("http_proxy")).toBeInTheDocument();
    expect(screen.getByText("https_proxy")).toBeInTheDocument();
    expect(screen.getByText("ALL_PROXY")).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run:

```bash
pnpm test src/app/App.test.tsx
```

Expected: FAIL because `src/app/App.tsx` or test setup does not exist.

- [ ] **Step 8: Add minimal app implementation**

Create `src/test/setup.ts` with:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `src/app/App.tsx` with:

```tsx
import "./styles.css";

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">Terminal proxy manager</p>
          <h1>Term Proxy</h1>
        </div>
        <span className="app-status">Not integrated</span>
      </header>

      <section className="proxy-tabs" aria-label="Proxy types">
        <button type="button">http_proxy</button>
        <button type="button">https_proxy</button>
        <button type="button">ALL_PROXY</button>
      </section>
    </main>
  );
}
```

Create `src/main.tsx` with:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/app/styles.css` with:

```css
:root {
  color: oklch(0.18 0.012 130);
  background: oklch(1 0 0);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100dvh;
  background: oklch(1 0 0);
}

button {
  font: inherit;
}

.app-shell {
  min-height: 100dvh;
  padding: 32px;
  background: linear-gradient(180deg, oklch(1 0 0), oklch(0.972 0.004 130));
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 1120px;
  margin: 0 auto 24px;
}

.app-kicker {
  margin: 0 0 6px;
  color: oklch(0.47 0.018 130);
  font-size: 13px;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.app-status {
  border: 1px solid oklch(0.88 0.008 130);
  border-radius: 999px;
  padding: 6px 12px;
  color: oklch(0.47 0.018 130);
  font-size: 13px;
}

.proxy-tabs {
  display: flex;
  gap: 8px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 4px;
  border: 1px solid oklch(0.88 0.008 130);
  border-radius: 12px;
  background: oklch(0.972 0.004 130);
}

.proxy-tabs button {
  border: 0;
  border-radius: 9px;
  padding: 10px 14px;
  background: transparent;
  color: oklch(0.18 0.012 130);
  cursor: pointer;
}

.proxy-tabs button:first-child {
  background: oklch(1 0 0);
  box-shadow: 0 1px 2px oklch(0 0 0 / 0.08);
}
```

- [ ] **Step 9: Run test to verify it passes**

Run:

```bash
pnpm test src/app/App.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit frontend foundation**

Run:

```bash
git add package.json pnpm-lock.yaml index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "feat: add react vite foundation"
```

Expected: commit succeeds.

## Task 3: i18n and Initial Product UI Shell

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Create: `src/shared/i18n/index.ts`
- Create: `src/shared/i18n/locales/zh-CN.json`
- Create: `src/shared/i18n/locales/en.json`
- Create: `src/shared/i18n/locales/ja.json`
- Create: `src/shared/i18n/locales/zh-TW.json`
- Create: `src/features/proxies/ProxyDashboard.tsx`
- Create: `src/features/settings/SettingsPanel.tsx`
- Create: `src/features/import/ImportNotice.tsx`

**Interfaces:**
- Consumes: React app shell from Task 2.
- Produces: i18n-backed visible UI with proxy dashboard placeholders.

- [ ] **Step 1: Write failing i18n UI test**

Replace `src/app/App.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import "../shared/i18n";

describe("App", () => {
  it("renders translated proxy management sections", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Term Proxy" })).toBeInTheDocument();
    expect(screen.getByText("Proxy types")).toBeInTheDocument();
    expect(screen.getByText("Import existing proxy")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/app/App.test.tsx
```

Expected: FAIL because i18n resources and feature components do not exist.

- [ ] **Step 3: Add i18n resources**

Create `src/shared/i18n/locales/en.json` with:

```json
{
  "app": {
    "title": "Term Proxy",
    "subtitle": "Terminal proxy manager",
    "statusNotIntegrated": "Not integrated"
  },
  "proxy": {
    "types": "Proxy types",
    "emptyTitle": "No proxies yet",
    "emptyDescription": "Add a proxy configuration to start managing terminal environment variables.",
    "kind": {
      "http": "http_proxy",
      "https": "https_proxy",
      "all": "ALL_PROXY"
    }
  },
  "import": {
    "title": "Import existing proxy",
    "description": "Existing shell profile proxy values will appear here for confirmation."
  },
  "settings": {
    "title": "Settings",
    "theme": "Theme",
    "language": "Language",
    "autoLaunch": "Launch at startup",
    "noProxy": "Global no_proxy"
  }
}
```

Create `src/shared/i18n/locales/zh-CN.json` with:

```json
{
  "app": {
    "title": "Term Proxy",
    "subtitle": "终端代理管理器",
    "statusNotIntegrated": "未集成"
  },
  "proxy": {
    "types": "代理类型",
    "emptyTitle": "还没有代理配置",
    "emptyDescription": "添加代理配置后即可统一管理终端环境变量。",
    "kind": {
      "http": "http_proxy",
      "https": "https_proxy",
      "all": "ALL_PROXY"
    }
  },
  "import": {
    "title": "导入现有代理",
    "description": "扫描到的 Shell profile 代理配置会在这里等待你确认。"
  },
  "settings": {
    "title": "设置",
    "theme": "主题",
    "language": "语言",
    "autoLaunch": "开机自启",
    "noProxy": "全局 no_proxy"
  }
}
```

Create `src/shared/i18n/locales/ja.json` with:

```json
{
  "app": {
    "title": "Term Proxy",
    "subtitle": "ターミナルプロキシ管理",
    "statusNotIntegrated": "未連携"
  },
  "proxy": {
    "types": "プロキシ種別",
    "emptyTitle": "プロキシ設定はまだありません",
    "emptyDescription": "設定を追加すると、ターミナル環境変数を管理できます。",
    "kind": {
      "http": "http_proxy",
      "https": "https_proxy",
      "all": "ALL_PROXY"
    }
  },
  "import": {
    "title": "既存プロキシをインポート",
    "description": "検出した shell profile のプロキシ値を確認できます。"
  },
  "settings": {
    "title": "設定",
    "theme": "テーマ",
    "language": "言語",
    "autoLaunch": "起動時に開く",
    "noProxy": "グローバル no_proxy"
  }
}
```

Create `src/shared/i18n/locales/zh-TW.json` with:

```json
{
  "app": {
    "title": "Term Proxy",
    "subtitle": "終端代理管理器",
    "statusNotIntegrated": "未整合"
  },
  "proxy": {
    "types": "代理類型",
    "emptyTitle": "尚無代理設定",
    "emptyDescription": "新增代理設定後即可統一管理終端環境變數。",
    "kind": {
      "http": "http_proxy",
      "https": "https_proxy",
      "all": "ALL_PROXY"
    }
  },
  "import": {
    "title": "匯入現有代理",
    "description": "掃描到的 Shell profile 代理設定會在這裡等待你確認。"
  },
  "settings": {
    "title": "設定",
    "theme": "主題",
    "language": "語言",
    "autoLaunch": "開機自動啟動",
    "noProxy": "全域 no_proxy"
  }
}
```

Create `src/shared/i18n/index.ts` with:

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ja from "./locales/ja.json";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";

void i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    en: { translation: en },
    ja: { translation: ja },
    "zh-TW": { translation: zhTW },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
```

- [ ] **Step 4: Add feature shell components**

Create `src/features/proxies/ProxyDashboard.tsx` with:

```tsx
import { useTranslation } from "react-i18next";

const proxyKinds = [
  { key: "http", value: "http_proxy" },
  { key: "https", value: "https_proxy" },
  { key: "all", value: "ALL_PROXY" },
] as const;

export function ProxyDashboard() {
  const { t } = useTranslation();

  return (
    <section className="panel proxy-panel" aria-labelledby="proxy-types-heading">
      <div className="panel-header">
        <h2 id="proxy-types-heading">{t("proxy.types")}</h2>
      </div>

      <div className="proxy-kind-list" role="tablist" aria-label={t("proxy.types")}>
        {proxyKinds.map((kind, index) => (
          <button
            key={kind.value}
            type="button"
            role="tab"
            aria-selected={index === 0}
            className={index === 0 ? "is-active" : undefined}
          >
            {t(`proxy.kind.${kind.key}`)}
          </button>
        ))}
      </div>

      <div className="empty-state">
        <h3>{t("proxy.emptyTitle")}</h3>
        <p>{t("proxy.emptyDescription")}</p>
      </div>
    </section>
  );
}
```

Create `src/features/import/ImportNotice.tsx` with:

```tsx
import { useTranslation } from "react-i18next";

export function ImportNotice() {
  const { t } = useTranslation();

  return (
    <section className="panel import-panel" aria-labelledby="import-heading">
      <h2 id="import-heading">{t("import.title")}</h2>
      <p>{t("import.description")}</p>
    </section>
  );
}
```

Create `src/features/settings/SettingsPanel.tsx` with:

```tsx
import { useTranslation } from "react-i18next";

export function SettingsPanel() {
  const { t } = useTranslation();

  return (
    <aside className="panel settings-panel" aria-labelledby="settings-heading">
      <h2 id="settings-heading">{t("settings.title")}</h2>
      <dl>
        <div>
          <dt>{t("settings.theme")}</dt>
          <dd>System</dd>
        </div>
        <div>
          <dt>{t("settings.language")}</dt>
          <dd>System</dd>
        </div>
        <div>
          <dt>{t("settings.autoLaunch")}</dt>
          <dd>Off</dd>
        </div>
        <div>
          <dt>{t("settings.noProxy")}</dt>
          <dd>localhost, 127.0.0.1</dd>
        </div>
      </dl>
    </aside>
  );
}
```

- [ ] **Step 5: Wire i18n app shell**

Replace `src/app/App.tsx` with:

```tsx
import { useTranslation } from "react-i18next";

import { ImportNotice } from "../features/import/ImportNotice";
import { ProxyDashboard } from "../features/proxies/ProxyDashboard";
import { SettingsPanel } from "../features/settings/SettingsPanel";
import "../shared/i18n";
import "./styles.css";

export function App() {
  const { t } = useTranslation();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">{t("app.subtitle")}</p>
          <h1>{t("app.title")}</h1>
        </div>
        <span className="app-status">{t("app.statusNotIntegrated")}</span>
      </header>

      <div className="app-grid">
        <div className="main-column">
          <ProxyDashboard />
          <ImportNotice />
        </div>
        <SettingsPanel />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Extend styles**

Append to `src/app/styles.css`:

```css
.app-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  max-width: 1120px;
  margin: 0 auto;
}

.main-column {
  display: grid;
  gap: 20px;
}

.panel {
  border: 1px solid oklch(0.88 0.008 130);
  border-radius: 14px;
  background: oklch(1 0 0);
  padding: 18px;
}

.panel h2,
.panel h3,
.panel p {
  margin-top: 0;
}

.panel h2 {
  font-size: 16px;
  line-height: 1.3;
}

.panel p {
  color: oklch(0.47 0.018 130);
  line-height: 1.6;
}

.proxy-kind-list {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.proxy-kind-list button {
  border: 1px solid oklch(0.88 0.008 130);
  border-radius: 10px;
  background: oklch(1 0 0);
  padding: 8px 12px;
  cursor: pointer;
}

.proxy-kind-list button.is-active {
  border-color: oklch(0.56 0.15 130);
  background: oklch(0.94 0.05 130);
}

.empty-state {
  border: 1px dashed oklch(0.88 0.008 130);
  border-radius: 12px;
  padding: 20px;
  background: oklch(0.972 0.004 130);
}

.settings-panel dl {
  display: grid;
  gap: 14px;
  margin: 0;
}

.settings-panel dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.settings-panel dt {
  color: oklch(0.47 0.018 130);
}

.settings-panel dd {
  margin: 0;
  font-weight: 600;
}

@media (max-width: 820px) {
  .app-shell {
    padding: 20px;
  }

  .app-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .app-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run:

```bash
pnpm test src/app/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit i18n UI shell**

Run:

```bash
git add src
git commit -m "feat: add localized app shell"
```

Expected: commit succeeds.

## Task 4: Typed Tauri Boundary and Rust App Command

**Files:**
- Create: `src/shared/tauri/api.ts`
- Create: `src/shared/types/proxy.ts`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/app.rs`
- Create: `src-tauri/src/services/mod.rs`
- Create: `src-tauri/src/services/app.rs`
- Create: `src-tauri/src/models/mod.rs`
- Create: `src-tauri/src/models/app.rs`

**Interfaces:**
- Consumes: Tauri 2 CLI and Rust/Cargo.
- Produces: minimal `get_app_info` Tauri command and typed frontend wrapper.

- [ ] **Step 1: Add frontend type definitions**

Create `src/shared/types/proxy.ts` with:

```ts
export type ProxyKind = "http_proxy" | "https_proxy" | "ALL_PROXY";

export type ProxyScheme = "http" | "https" | "socks4" | "socks5";

export type ProxyConfig = {
  id: string;
  name: string;
  kind: ProxyKind;
  scheme: ProxyScheme;
  host: string;
  port: number;
  username?: string;
  password?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
};
```

- [ ] **Step 2: Add typed Tauri API wrapper**

Create `src/shared/tauri/api.ts` with:

```ts
import { invoke } from "@tauri-apps/api/core";

import type { AppInfo } from "../types/proxy";

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("get_app_info");
}
```

- [ ] **Step 3: Add Rust Tauri manifest**

Create `src-tauri/Cargo.toml` with:

```toml
[package]
name = "term-proxy"
version = "0.1.0"
description = "Terminal proxy manager"
authors = ["Term Proxy contributors"]
edition = "2021"

[lib]
name = "term_proxy_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
```

Create `src-tauri/tauri.conf.json` with:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Term Proxy",
  "version": "0.1.0",
  "identifier": "dev.ruoduan.term-proxy",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Term Proxy",
        "width": 1080,
        "height": 720,
        "minWidth": 840,
        "minHeight": 560
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": []
  }
}
```

- [ ] **Step 4: Add Rust command test first**

Create `src-tauri/src/services/app.rs` with:

```rust
use crate::models::app::AppInfo;

pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "Term Proxy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::get_app_info;

    #[test]
    fn returns_app_info_with_name_version_and_platform() {
        let info = get_app_info();

        assert_eq!(info.name, "Term Proxy");
        assert!(!info.version.is_empty());
        assert!(!info.platform.is_empty());
    }
}
```

Create `src-tauri/src/services/mod.rs` with:

```rust
pub mod app;
```

- [ ] **Step 5: Run Rust test to verify it fails**

Run:

```bash
cd src-tauri && cargo test services::app::tests::returns_app_info_with_name_version_and_platform
```

Expected: FAIL because `crate::models::app::AppInfo` is not defined.

- [ ] **Step 6: Add Rust models and commands**

Create `src-tauri/src/models/app.rs` with:

```rust
use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
}
```

Create `src-tauri/src/models/mod.rs` with:

```rust
pub mod app;
```

Create `src-tauri/src/commands/app.rs` with:

```rust
use crate::models::app::AppInfo;

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    crate::services::app::get_app_info()
}
```

Create `src-tauri/src/commands/mod.rs` with:

```rust
pub mod app;
```

Create `src-tauri/src/main.rs` with:

```rust
mod commands;
mod models;
mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::app::get_app_info])
        .run(tauri::generate_context!())
        .expect("failed to run Term Proxy");
}

fn main() {
    run();
}
```

- [ ] **Step 7: Run Rust test to verify it passes**

Run:

```bash
cd src-tauri && cargo test services::app::tests::returns_app_info_with_name_version_and_platform
```

Expected: PASS.

- [ ] **Step 8: Run frontend typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit Tauri boundary**

Run:

```bash
git add src/shared src-tauri
git commit -m "feat: add tauri command boundary"
```

Expected: commit succeeds.

## Task 5: Foundation Verification

**Files:**
- Modify: none unless verification exposes a required fix.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified foundation ready for proxy feature implementation.

- [ ] **Step 1: Run frontend tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Run frontend typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:

```bash
pnpm build
```

Expected: PASS and `dist/` is generated.

- [ ] **Step 4: Run Rust tests**

Run:

```bash
cd src-tauri && cargo test
```

Expected: PASS.

- [ ] **Step 5: Inspect git status**

Run:

```bash
git status --short
```

Expected: no unexpected untracked or modified files except generated artifacts ignored by `.gitignore`.

- [ ] **Step 6: Commit verification fixes if needed**

If any verification command required code fixes, run:

```bash
git add <changed-files>
git commit -m "fix: stabilize project foundation"
```

Expected: commit succeeds only if fixes were needed.

## Self-Review

- Spec coverage: This plan covers repository initialization, documentation baseline, frontend Vite shell, i18n scaffolding, product UI foundation, typed Tauri API wrapper, Rust command/service/model boundary, and verification. It intentionally does not implement proxy CRUD, profile writing, import scanner, auto-launch, or shell adapters; those require separate plans.
- Placeholder scan: No TBD/TODO/fill-in placeholders are present.
- Type consistency: `AppInfo`, `ProxyKind`, `ProxyScheme`, and `ProxyConfig` are consistently named across frontend and Rust boundaries.
