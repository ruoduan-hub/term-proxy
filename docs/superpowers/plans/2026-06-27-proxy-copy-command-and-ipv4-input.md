# Proxy Copy Command And IPv4 Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make proxy host inputs accept only IPv4 characters with inline validation, and make row copy actions copy platform-specific terminal commands.

**Architecture:** Add focused frontend helpers for host sanitization, IPv4 validation, proxy URL creation, platform detection, and copy command formatting. Keep `ProxyDashboard` responsible for form interaction and `App` responsible for clipboard calls and platform-aware command creation.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, i18next, Tauri clipboard wrapper.

## Global Constraints

- The host input allows only digits and dots while typing or pasting.
- Saving still requires a complete valid IPv4 address.
- Invalid IPv4 values show an inline form error and do not call the save handler.
- `HTTP_PROXY` rows copy commands for both `http_proxy` and `https_proxy`.
- `ALL_PROXY` rows copy only the `ALL_PROXY` command.
- Treat `windows` and `win32` as Windows; treat all other platforms as POSIX.
- All visible copy labels, validation text, and success toasts remain internationalized.
- Do not change Rust managed script generation for this feature.
- Do not touch unrelated existing worktree changes such as `AGENTS.md`.

---

## File Structure

- Create `src/features/proxies/proxyCommand.ts`: pure helpers for host filtering, IPv4 validation, URL formatting, platform detection, and copy command formatting.
- Create `src/features/proxies/proxyCommand.test.ts`: focused unit tests for helpers.
- Modify `src/features/proxies/ProxyDashboard.tsx`: use helper functions, controlled host inputs, inline validation errors, and copy selected proxy objects.
- Modify `src/features/proxies/ProxyDashboard.test.tsx`: update copy expectations and cover input filtering plus inline validation.
- Modify `src/App.tsx`: load app platform, format copy commands, and copy command text.
- Modify `src/App.test.tsx`: mock app info, verify POSIX and PowerShell copied commands.
- Modify `src/shared/i18n/locales/{zh-CN,en,ja,zh-TW}.json`: update copy labels, copy toast, and add host validation error.
- Modify `README.md`, `README.zh-CN.md`, `README.ja.md`, and `docs/README.md`: replace raw URL copy wording with platform-specific terminal command copy wording.

---

### Task 1: Add Proxy Command Helpers

**Files:**
- Create: `src/features/proxies/proxyCommand.ts`
- Create: `src/features/proxies/proxyCommand.test.ts`

**Interfaces:**
- Produces:
  - `sanitizeHostInput(value: string): string`
  - `isValidIpv4Address(value: string): boolean`
  - `proxyGroupForKind(kind: ProxyKind): ProxyGroup`
  - `formatProxyUrl(proxy: Pick<ProxyConfig, "scheme" | "host" | "port">): string`
  - `isWindowsPlatform(platform: string | null | undefined): boolean`
  - `formatProxyCopyCommand(proxy: Pick<ProxyConfig, "kind" | "scheme" | "host" | "port">, platform: string | null | undefined): string`

- [ ] **Step 1: Write failing helper tests**

Create `src/features/proxies/proxyCommand.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { ProxyConfig } from "@/shared/types/proxy";
import {
  formatProxyCopyCommand,
  formatProxyUrl,
  isValidIpv4Address,
  isWindowsPlatform,
  proxyGroupForKind,
  sanitizeHostInput,
} from "./proxyCommand";

function proxy(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    id: "http-a",
    name: "Local HTTP",
    kind: "http_proxy",
    scheme: "http",
    host: "127.0.0.1",
    port: 7890,
    enabled: false,
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
    ...overrides,
  };
}

describe("proxyCommand", () => {
  it("filters host input to digits and dots", () => {
    expect(sanitizeHostInput("http://127.0.0.1:7890")).toBe("127.0.0.17890");
    expect(sanitizeHostInput("local host 10.0.0.2")).toBe("10.0.0.2");
    expect(sanitizeHostInput("abc")).toBe("");
  });

  it("validates complete IPv4 addresses", () => {
    expect(isValidIpv4Address("0.0.0.0")).toBe(true);
    expect(isValidIpv4Address("127.0.0.1")).toBe(true);
    expect(isValidIpv4Address("255.255.255.255")).toBe(true);
    expect(isValidIpv4Address("1.2.3")).toBe(false);
    expect(isValidIpv4Address("999.1.1.1")).toBe(false);
    expect(isValidIpv4Address("localhost")).toBe(false);
    expect(isValidIpv4Address("")).toBe(false);
  });

  it("maps legacy proxy kinds to user-facing groups", () => {
    expect(proxyGroupForKind("http_proxy")).toBe("HTTP_PROXY");
    expect(proxyGroupForKind("https_proxy")).toBe("HTTP_PROXY");
    expect(proxyGroupForKind("ALL_PROXY")).toBe("ALL_PROXY");
  });

  it("formats proxy URLs", () => {
    expect(formatProxyUrl(proxy({ scheme: "socks5", host: "10.0.0.2", port: 1080 }))).toBe(
      "socks5://10.0.0.2:1080",
    );
  });

  it("detects Windows platform names", () => {
    expect(isWindowsPlatform("windows")).toBe(true);
    expect(isWindowsPlatform("win32")).toBe(true);
    expect(isWindowsPlatform("macos")).toBe(false);
    expect(isWindowsPlatform("linux")).toBe(false);
    expect(isWindowsPlatform(undefined)).toBe(false);
  });

  it("formats POSIX copy commands", () => {
    expect(formatProxyCopyCommand(proxy(), "macos")).toBe(
      "export http_proxy=http://127.0.0.1:7890; export https_proxy=http://127.0.0.1:7890",
    );
    expect(formatProxyCopyCommand(proxy({ kind: "ALL_PROXY" }), "linux")).toBe(
      "export ALL_PROXY=http://127.0.0.1:7890",
    );
  });

  it("formats PowerShell copy commands", () => {
    expect(formatProxyCopyCommand(proxy(), "windows")).toBe(
      '$env:http_proxy="http://127.0.0.1:7890"; $env:https_proxy="http://127.0.0.1:7890"',
    );
    expect(formatProxyCopyCommand(proxy({ kind: "ALL_PROXY" }), "win32")).toBe(
      '$env:ALL_PROXY="http://127.0.0.1:7890"',
    );
  });
});
```

- [ ] **Step 2: Run helper tests and verify red**

Run: `pnpm test src/features/proxies/proxyCommand.test.ts`

Expected: FAIL because `src/features/proxies/proxyCommand.ts` does not exist.

- [ ] **Step 3: Implement helpers**

Create `src/features/proxies/proxyCommand.ts`:

```ts
import type { ProxyConfig, ProxyGroup, ProxyKind } from "@/shared/types/proxy";

type ProxyUrlParts = Pick<ProxyConfig, "scheme" | "host" | "port">;
type ProxyCopyParts = Pick<ProxyConfig, "kind" | "scheme" | "host" | "port">;

export function sanitizeHostInput(value: string): string {
  return value.replace(/[^0-9.]/g, "");
}

export function isValidIpv4Address(value: string): boolean {
  const octets = value.split(".");

  if (octets.length !== 4) {
    return false;
  }

  return octets.every((octet) => {
    if (!/^\d+$/.test(octet)) {
      return false;
    }

    const number = Number(octet);
    return number >= 0 && number <= 255;
  });
}

export function proxyGroupForKind(kind: ProxyKind): ProxyGroup {
  return kind === "ALL_PROXY" ? "ALL_PROXY" : "HTTP_PROXY";
}

export function formatProxyUrl(proxy: ProxyUrlParts): string {
  return `${proxy.scheme}://${proxy.host.trim()}:${proxy.port}`;
}

export function isWindowsPlatform(platform: string | null | undefined): boolean {
  const normalizedPlatform = platform?.toLowerCase();
  return normalizedPlatform === "windows" || normalizedPlatform === "win32";
}

export function formatProxyCopyCommand(
  proxy: ProxyCopyParts,
  platform: string | null | undefined,
): string {
  const url = formatProxyUrl(proxy);

  if (isWindowsPlatform(platform)) {
    return proxyGroupForKind(proxy.kind) === "HTTP_PROXY"
      ? `$env:http_proxy="${url}"; $env:https_proxy="${url}"`
      : `$env:ALL_PROXY="${url}"`;
  }

  return proxyGroupForKind(proxy.kind) === "HTTP_PROXY"
    ? `export http_proxy=${url}; export https_proxy=${url}`
    : `export ALL_PROXY=${url}`;
}
```

- [ ] **Step 4: Run helper tests and verify green**

Run: `pnpm test src/features/proxies/proxyCommand.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit helper task**

```bash
git add src/features/proxies/proxyCommand.ts src/features/proxies/proxyCommand.test.ts
git commit -m "feat: add proxy copy command helpers"
```

---

### Task 2: Enforce IPv4 Host Input In ProxyDashboard

**Files:**
- Modify: `src/features/proxies/ProxyDashboard.tsx`
- Modify: `src/features/proxies/ProxyDashboard.test.tsx`

**Interfaces:**
- Consumes:
  - `sanitizeHostInput(value: string): string`
  - `isValidIpv4Address(value: string): boolean`
  - `formatProxyUrl(proxy): string`
  - `proxyGroupForKind(kind): ProxyGroup`

- [ ] **Step 1: Write failing component tests**

Add these tests to `src/features/proxies/ProxyDashboard.test.tsx`:

```ts
it("filters add form host input to digits and dots", async () => {
  const user = userEvent.setup();

  render(
    <ProxyDashboard
      proxies={[]}
      onAddProxy={vi.fn()}
      onEnableProxy={vi.fn()}
      onDisableProxy={vi.fn()}
      onUpdateProxy={vi.fn()}
      onDeleteProxy={vi.fn()}
      onCopyProxyCommand={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Add proxy" }));
  await user.type(screen.getByLabelText("Host"), "local host 10.0.0.2:8080");

  expect(screen.getByLabelText("Host")).toHaveValue("10.0.0.28080");
});

it("shows an inline error and does not submit invalid add form IPv4 hosts", async () => {
  const user = userEvent.setup();
  const onAddProxy = vi.fn();

  render(
    <ProxyDashboard
      proxies={[]}
      onAddProxy={onAddProxy}
      onEnableProxy={vi.fn()}
      onDisableProxy={vi.fn()}
      onUpdateProxy={vi.fn()}
      onDeleteProxy={vi.fn()}
      onCopyProxyCommand={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Add proxy" }));
  await user.type(screen.getByLabelText("Name"), "Local HTTP");
  await user.type(screen.getByLabelText("Host"), "999.1.1.1");
  await user.click(screen.getByRole("button", { name: "Save proxy" }));

  expect(screen.getByText("Enter a valid IPv4 address.")).toBeInTheDocument();
  expect(onAddProxy).not.toHaveBeenCalled();
});

it("filters edit form host input and blocks invalid IPv4 hosts", async () => {
  const user = userEvent.setup();
  const onUpdateProxy = vi.fn();

  render(
    <ProxyDashboard
      proxies={[proxy({ id: "http-b", name: "Backup HTTP", host: "10.0.0.2" })]}
      onAddProxy={vi.fn()}
      onEnableProxy={vi.fn()}
      onDisableProxy={vi.fn()}
      onUpdateProxy={onUpdateProxy}
      onDeleteProxy={vi.fn()}
      onCopyProxyCommand={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Edit Backup HTTP" }));
  await user.clear(screen.getByLabelText("Host"));
  await user.type(screen.getByLabelText("Host"), "http://999.1.1.1");
  await user.click(screen.getByRole("button", { name: "Save proxy" }));

  expect(screen.getByLabelText("Host")).toHaveValue("999.1.1.1");
  expect(screen.getByText("Enter a valid IPv4 address.")).toBeInTheDocument();
  expect(onUpdateProxy).not.toHaveBeenCalled();
});
```

Update existing `ProxyDashboard` render calls in this test file from `onCopyProxyUrl={vi.fn()}` to
`onCopyProxyCommand={vi.fn()}`.

- [ ] **Step 2: Run dashboard tests and verify red**

Run: `pnpm test src/features/proxies/ProxyDashboard.test.tsx`

Expected: FAIL because `onCopyProxyCommand` and inline validation do not exist yet.

- [ ] **Step 3: Implement controlled host state and validation**

In `src/features/proxies/ProxyDashboard.tsx`:

```ts
import {
  formatProxyUrl,
  isValidIpv4Address,
  proxyGroupForKind,
  sanitizeHostInput,
} from "./proxyCommand";
```

Change props:

```ts
  onCopyProxyCommand: (proxy: ProxyConfig) => void;
```

Add state:

```ts
  const [addHost, setAddHost] = useState("");
  const [editHostById, setEditHostById] = useState<Record<string, string>>({});
  const [addHostError, setAddHostError] = useState(false);
  const [editHostErrorId, setEditHostErrorId] = useState<string | null>(null);
```

Add `noValidate` to both add and edit `<form>` elements so React can show the inline IPv4 error
instead of the browser stopping submission with native constraint validation first:

```tsx
<form noValidate ...>
```

Add helpers inside the component:

```ts
  function handleAddHostChange(value: string) {
    setAddHost(sanitizeHostInput(value));
    setAddHostError(false);
  }

  function editHostValue(proxy: ProxyConfig) {
    return editHostById[proxy.id] ?? proxy.host;
  }

  function handleEditHostChange(id: string, value: string) {
    setEditHostById((hosts) => ({
      ...hosts,
      [id]: sanitizeHostInput(value),
    }));
    setEditHostErrorId(null);
  }
```

In `handleSubmit`, use:

```ts
    const host = addHost.trim();

    if (!isValidIpv4Address(host)) {
      setAddHostError(true);
      return;
    }
```

and submit `host`.

After successful add reset:

```ts
      setAddHost("");
      setAddHostError(false);
```

In `handleEditSubmit`, use:

```ts
    const editingProxy = proxies.find((proxy) => proxy.id === id);
    const host = editingProxy ? editHostValue(editingProxy).trim() : "";

    if (!isValidIpv4Address(host)) {
      setEditHostErrorId(id);
      return;
    }
```

and submit `host`.

After successful edit:

```ts
      setEditHostById((hosts) => {
        const { [id]: _removed, ...remainingHosts } = hosts;
        return remainingHosts;
      });
      setEditHostErrorId(null);
```

For add host input:

```tsx
<Input
  id="proxy-host"
  name="host"
  value={addHost}
  onChange={(event) => handleAddHostChange(event.currentTarget.value)}
  inputMode="decimal"
  pattern={IPV4_ADDRESS_PATTERN}
  title={t("proxy.form.hostIpTitle")}
  aria-invalid={addHostError}
  aria-describedby={addHostError ? "proxy-host-error" : undefined}
  required
/>
{addHostError ? (
  <p id="proxy-host-error" className="text-sm text-destructive">
    {t("proxy.form.hostIpv4Error")}
  </p>
) : null}
```

For edit host input:

```tsx
<Input
  id={`proxy-host-${proxy.id}`}
  name="host"
  value={editHostValue(proxy)}
  onChange={(event) => handleEditHostChange(proxy.id, event.currentTarget.value)}
  inputMode="decimal"
  pattern={IPV4_ADDRESS_PATTERN}
  title={t("proxy.form.hostIpTitle")}
  aria-invalid={editHostErrorId === proxy.id}
  aria-describedby={editHostErrorId === proxy.id ? `proxy-host-error-${proxy.id}` : undefined}
  required
/>
{editHostErrorId === proxy.id ? (
  <p id={`proxy-host-error-${proxy.id}`} className="text-sm text-destructive">
    {t("proxy.form.hostIpv4Error")}
  </p>
) : null}
```

When starting edit:

```ts
setEditHostById((hosts) => ({ ...hosts, [proxy.id]: proxy.host }));
setEditHostErrorId(null);
```

On cancel and group change, clear related errors and temporary hosts.

Replace local `proxyUrl(proxy)` calls with `formatProxyUrl(proxy)`. Remove local
`proxyGroupForKind` because it comes from the helper.

- [ ] **Step 4: Add i18n key needed by tests**

Add to each locale under `proxy.form`:

```json
"hostIpv4Error": "Enter a valid IPv4 address."
```

Use translations:

- `zh-CN`: `请输入有效的 IPv4 地址。`
- `en`: `Enter a valid IPv4 address.`
- `ja`: `有効な IPv4 アドレスを入力してください。`
- `zh-TW`: `請輸入有效的 IPv4 位址。`

- [ ] **Step 5: Run dashboard tests and verify green**

Run: `pnpm test src/features/proxies/ProxyDashboard.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit dashboard task**

```bash
git add src/features/proxies/ProxyDashboard.tsx src/features/proxies/ProxyDashboard.test.tsx src/shared/i18n/locales/zh-CN.json src/shared/i18n/locales/en.json src/shared/i18n/locales/ja.json src/shared/i18n/locales/zh-TW.json
git commit -m "feat: enforce ipv4 proxy hosts"
```

---

### Task 3: Copy Platform-Specific Commands In App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/features/proxies/ProxyDashboard.tsx`
- Modify: `src/features/proxies/ProxyDashboard.test.tsx`
- Modify: `src/shared/i18n/locales/{zh-CN,en,ja,zh-TW}.json`

**Interfaces:**
- Consumes:
  - `formatProxyCopyCommand(proxy, platform): string`
  - `formatProxyUrl(proxy): string`

- [ ] **Step 1: Write failing copy tests**

In `src/features/proxies/ProxyDashboard.test.tsx`, replace the old copy URL test with:

```ts
it("passes the selected proxy to the copy command handler", async () => {
  const user = userEvent.setup();
  const onCopyProxyCommand = vi.fn();
  const selectedProxy = proxy({ id: "http-b", name: "Backup HTTP", host: "10.0.0.2" });

  render(
    <ProxyDashboard
      proxies={[selectedProxy]}
      onAddProxy={vi.fn()}
      onEnableProxy={vi.fn()}
      onDisableProxy={vi.fn()}
      onUpdateProxy={vi.fn()}
      onDeleteProxy={vi.fn()}
      onCopyProxyCommand={onCopyProxyCommand}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Copy Backup HTTP command" }));

  expect(onCopyProxyCommand).toHaveBeenCalledWith(selectedProxy);
});
```

In `src/App.test.tsx`, update the existing copy test to expect POSIX command text:

```ts
expect(api.copyText).toHaveBeenCalledWith(
  "export http_proxy=http://127.0.0.1:1087; export https_proxy=http://127.0.0.1:1087",
);
expect(toast.success).toHaveBeenCalledWith("Proxy command copied");
```

Update the `vi.mock("./shared/tauri/api", ...)` block in `src/App.test.tsx` to include:

```ts
getAppInfo: vi.fn(async () => ({
  name: "Term Proxy",
  version: "1.0.1",
  platform: "macos",
})),
```

Add a Windows test:

```ts
it("copies a PowerShell proxy command on Windows", async () => {
  const user = userEvent.setup();
  const api = await import("./shared/tauri/api");
  vi.mocked(api.getAppInfo).mockResolvedValueOnce({
    name: "Term Proxy",
    version: "1.0.1",
    platform: "windows",
  });
  vi.mocked(api.getProxyStore).mockResolvedValueOnce({
    proxies: [
      {
        id: "http-a",
        name: "Local HTTP",
        kind: "http_proxy",
        scheme: "http",
        host: "127.0.0.1",
        port: 1087,
        enabled: false,
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    ],
    settings: {
      theme: "system",
      language: "system",
      autoLaunch: false,
      noProxy: "localhost,127.0.0.1",
      shellIntegration: {
        zsh: false,
        bash: false,
        powershell: false,
      },
    },
  });

  await renderApp();

  await user.click(screen.getByRole("button", { name: "Copy Local HTTP command" }));

  expect(api.copyText).toHaveBeenCalledWith(
    '$env:http_proxy="http://127.0.0.1:1087"; $env:https_proxy="http://127.0.0.1:1087"',
  );
});
```

- [ ] **Step 2: Run app and dashboard tests and verify red**

Run:

```bash
pnpm test src/features/proxies/ProxyDashboard.test.tsx src/App.test.tsx
```

Expected: FAIL because copy labels and app command formatting are not implemented yet.

- [ ] **Step 3: Implement App platform state and command copying**

In `src/App.tsx`, import:

```ts
import { formatProxyCopyCommand } from "./features/proxies/proxyCommand";
```

Also import `getAppInfo` from the Tauri API wrapper.

Add state:

```ts
  const [platform, setPlatform] = useState<string | null>(null);
```

Add an effect:

```ts
  useEffect(() => {
    let isMounted = true;

    void getAppInfo()
      .then((appInfo) => {
        if (isMounted) {
          setPlatform(appInfo.platform);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlatform(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);
```

Replace `handleCopyProxyUrl(url: string)` with:

```ts
  async function handleCopyProxyCommand(proxy: ProxyConfig) {
    try {
      await copyText(formatProxyCopyCommand(proxy, platform));
      setError(null);
      toast.success(t("feedback.proxyCommandCopied"));
    } catch (unknownError) {
      const message = errorMessageFromUnknown(unknownError);
      setError(message);
      toast.error(message);
    }
  }
```

Pass `onCopyProxyCommand={handleCopyProxyCommand}` to `ProxyDashboard`.

- [ ] **Step 4: Update ProxyDashboard copy prop and labels**

In `src/features/proxies/ProxyDashboard.tsx`, change:

```ts
onCopyProxyCommand: (proxy: ProxyConfig) => void;
```

Use:

```tsx
aria-label={t("proxy.copyCommandNamed", { name: proxy.name })}
onClick={() => onCopyProxyCommand(proxy)}
```

Update the displayed URL to use:

```tsx
{formatProxyUrl(proxy)}
```

- [ ] **Step 5: Update i18n copy keys**

In each locale:

- Replace `proxy.copyUrlNamed` with `proxy.copyCommandNamed`.
- Replace `feedback.proxyUrlCopied` with `feedback.proxyCommandCopied`.

Values:

- `zh-CN`: `复制 {{name}} 命令`, `代理命令已复制`
- `en`: `Copy {{name}} command`, `Proxy command copied`
- `ja`: `{{name}} のコマンドをコピー`, `プロキシコマンドをコピーしました`
- `zh-TW`: `複製 {{name}} 命令`, `代理命令已複製`

- [ ] **Step 6: Run app and dashboard tests and verify green**

Run:

```bash
pnpm test src/features/proxies/ProxyDashboard.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit app copy task**

```bash
git add src/App.tsx src/App.test.tsx src/features/proxies/ProxyDashboard.tsx src/features/proxies/ProxyDashboard.test.tsx src/shared/i18n/locales/zh-CN.json src/shared/i18n/locales/en.json src/shared/i18n/locales/ja.json src/shared/i18n/locales/zh-TW.json
git commit -m "feat: copy platform proxy commands"
```

---

### Task 4: Update README Copy Wording

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `README.ja.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: completed UI behavior from Tasks 1-3.
- Produces: README text consistent with the feature.

- [ ] **Step 1: Update raw URL copy wording**

Replace these lines:

```md
- Copy proxy URLs to the system clipboard.
```

with:

```md
- Copy platform-specific terminal proxy commands to the system clipboard.
```

Replace:

```md
- 一键复制代理 URL。
```

with:

```md
- 一键复制当前系统可用的终端代理命令。
```

Replace:

```md
- プロキシ URL をクリップボードへコピー。
```

with:

```md
- 現在の OS に合ったターミナル用プロキシコマンドをクリップボードへコピー。
```

- [ ] **Step 2: Verify no stale raw URL copy wording remains**

Run:

```bash
rg -n "Copy proxy URLs|复制代理 URL|プロキシ URL をクリップボード" README.md README.zh-CN.md README.ja.md docs/README.md
```

Expected: no matches.

- [ ] **Step 3: Commit README task**

```bash
git add README.md README.zh-CN.md README.ja.md docs/README.md
git commit -m "docs: update proxy copy command wording"
```

---

### Task 5: Final Verification

**Files:**
- Verify all files changed by Tasks 1-4.

**Interfaces:**
- Consumes: all earlier task outputs.
- Produces: verified working feature.

- [ ] **Step 1: Run frontend typecheck**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 2: Run frontend tests**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run: `pnpm build`

Expected: PASS. If Vite prints a Node version warning but exits successfully, record it in the final summary.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intentional uncommitted changes remain. `AGENTS.md` may remain modified if it was already modified by the user and must not be reverted.
