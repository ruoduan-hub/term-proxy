import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

import { App } from "./App";
import { i18n } from "./shared/i18n";
import { ThemeProvider } from "./shared/theme/ThemeProvider";

vi.mock("./shared/tauri/api", () => ({
  enableProxyConfig: vi.fn(),
  getProxyStore: vi.fn(async () => ({
    proxies: [],
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
  })),
  scanProxyImports: vi.fn(async () => []),
  installShellIntegration: vi.fn(async () => ({
    proxies: [],
    settings: {
      theme: "system",
      language: "system",
      autoLaunch: false,
      noProxy: "localhost,127.0.0.1",
      shellIntegration: {
        zsh: true,
        bash: false,
        powershell: false,
      },
    },
  })),
  removeShellIntegration: vi.fn(),
  saveProxyStore: vi.fn(async (store) => store),
}));

describe("App", () => {
  afterEach(async () => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders translated proxy management sections", async () => {
    const api = await import("./shared/tauri/api");

    await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());

    expect(screen.getByText("Proxy types")).toBeInTheDocument();
    expect(screen.queryByText("Import detected proxies")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Term Proxy" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add proxy" })).toBeInTheDocument();
    expect(screen.queryByText("Shell integration")).not.toBeInTheDocument();
  });

  it("opens settings in a separate view and returns to proxy management", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");

    await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Settings" }));

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Shell integration")).toBeInTheDocument();
    expect(screen.queryByText("Proxy types")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to proxies" }));

    expect(screen.getByText("Proxy types")).toBeInTheDocument();
    expect(screen.queryByText("Shell integration")).not.toBeInTheDocument();
  });

  it("keeps the settings view aligned to the app content width", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
    const { container } = await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Settings" }));

    expect(container.querySelector(".max-w-xl")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Settings" })).toBeInTheDocument();
  });

  it("saves a new proxy through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");

    await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Add proxy" }));
    await user.type(screen.getByLabelText("Name"), "Local HTTP");
    await user.type(screen.getByLabelText("Host"), "127.0.0.1");
    await user.clear(screen.getByLabelText("Port"));
    await user.type(screen.getByLabelText("Port"), "1087");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(api.saveProxyStore).toHaveBeenCalledWith(
      expect.objectContaining({
        proxies: [
          expect.objectContaining({
            name: "Local HTTP",
            kind: "http_proxy",
            scheme: "http",
            host: "127.0.0.1",
            port: 1087,
            enabled: false,
          }),
        ],
      }),
    );
  });

  it("imports a scanned profile proxy through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
    vi.mocked(api.scanProxyImports).mockResolvedValueOnce([
      {
        id: "/Users/example/.zshrc:1:http_proxy",
        name: "http_proxy 127.0.0.1:1087",
        kind: "http_proxy",
        scheme: "http",
        host: "127.0.0.1",
        port: 1087,
        shell: "zsh",
        sourcePath: "/Users/example/.zshrc",
        lineNumber: 1,
      },
    ]);

    await renderApp();

    expect(screen.getByText("Import detected proxies")).toBeInTheDocument();
    expect(screen.getByText("/Users/example/.zshrc:1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Import http_proxy 127.0.0.1:1087" }));

    expect(api.saveProxyStore).toHaveBeenCalledWith(
      expect.objectContaining({
        proxies: [
          expect.objectContaining({
            name: "http_proxy 127.0.0.1:1087",
            kind: "http_proxy",
            scheme: "http",
            host: "127.0.0.1",
            port: 1087,
            enabled: false,
          }),
        ],
      }),
    );
  });

  it("keeps the app usable when profile import scanning fails", async () => {
    const api = await import("./shared/tauri/api");
    vi.mocked(api.scanProxyImports).mockRejectedValueOnce(new Error("permission denied"));

    await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());
    expect(screen.getByText("Proxy types")).toBeInTheDocument();
    expect(screen.queryByText("permission denied")).not.toBeInTheDocument();
  });

  it("saves edited proxy values through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
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

    await user.click(screen.getByRole("button", { name: "Edit Local HTTP" }));
    await user.clear(screen.getByLabelText("Host"));
    await user.type(screen.getByLabelText("Host"), "10.0.0.3");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(api.saveProxyStore).toHaveBeenCalledWith(
      expect.objectContaining({
        proxies: [
          expect.objectContaining({
            id: "http-a",
            host: "10.0.0.3",
            updatedAt: expect.any(String),
          }),
        ],
      }),
    );
  });

  it("deletes a proxy through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
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

    await user.click(screen.getByRole("button", { name: "Delete Local HTTP" }));

    expect(api.saveProxyStore).toHaveBeenCalledWith(
      expect.objectContaining({
        proxies: [],
      }),
    );
  });

  it("installs shell integration from settings", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");

    await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("switch", { name: "zsh" }));

    expect(api.installShellIntegration).toHaveBeenCalledWith("zsh");
  });

  it("saves edited settings through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");

    await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.clear(screen.getByLabelText("Global no_proxy"));
    await user.type(screen.getByLabelText("Global no_proxy"), "localhost,127.0.0.1,*.local");
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(api.saveProxyStore).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          noProxy: "localhost,127.0.0.1,*.local",
        }),
      }),
    );
  });

  it("applies dark theme from stored settings", async () => {
    const api = await import("./shared/tauri/api");
    vi.mocked(api.getProxyStore).mockResolvedValueOnce({
      proxies: [],
      settings: {
        theme: "dark",
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

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  });

  it("applies stored language setting", async () => {
    const api = await import("./shared/tauri/api");
    vi.mocked(api.getProxyStore).mockResolvedValueOnce({
      proxies: [],
      settings: {
        theme: "system",
        language: "zh-CN",
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

    await waitFor(() => expect(screen.getByText("代理类型")).toBeInTheDocument());
  });
});

async function renderApp() {
  const renderResult = render(
    <ThemeProvider storageKey="term-proxy-test-theme">
      <App />
    </ThemeProvider>,
  );

  await act(async () => {
    await Promise.resolve();
  });

  return renderResult;
}
