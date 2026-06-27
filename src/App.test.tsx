import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

import { App } from "./App";
import { i18n } from "./shared/i18n";
import { ThemeProvider } from "./shared/theme/ThemeProvider";

vi.mock("./shared/tauri/api", () => ({
  copyText: vi.fn(async (_text: string) => {}),
  disableProxyConfig: vi.fn(),
  enableProxyConfig: vi.fn(),
  getAppInfo: vi.fn(async () => ({
    name: "Term Proxy",
    version: "1.0.1",
    platform: "macos",
  })),
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
  saveProxyStore: vi.fn(async (store) => store),
  setAutoLaunch: vi.fn(async (_enabled: boolean) => {}),
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
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
    expect(screen.queryByText("Shell integration")).not.toBeInTheDocument();
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
    const { toast } = await import("sonner");

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
    expect(toast.success).toHaveBeenCalledWith("Proxy saved");
  });

  it("shows an error toast when saving a proxy fails", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
    const { toast } = await import("sonner");
    vi.mocked(api.saveProxyStore).mockRejectedValueOnce(new Error("disk full"));

    await renderApp();

    await user.click(screen.getByRole("button", { name: "Add proxy" }));
    await user.type(screen.getByLabelText("Name"), "Local HTTP");
    await user.type(screen.getByLabelText("Host"), "127.0.0.1");
    await user.clear(screen.getByLabelText("Port"));
    await user.type(screen.getByLabelText("Port"), "1087");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(toast.error).toHaveBeenCalledWith("disk full");
  });

  it("copies a proxy command through the clipboard API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
    const { toast } = await import("sonner");
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
      "export http_proxy=http://127.0.0.1:1087; export https_proxy=http://127.0.0.1:1087",
    );
    expect(toast.success).toHaveBeenCalledWith("Proxy command copied");
  });

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

  it("resolves the platform before copying when store data loads first", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
    let resolveAppInfo: (appInfo: { name: string; version: string; platform: string }) => void =
      () => {};

    vi.mocked(api.copyText).mockClear();
    vi.mocked(api.getAppInfo).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAppInfo = resolve;
      }),
    );
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

    expect(api.copyText).toHaveBeenCalledTimes(1);
    expect(api.copyText).toHaveBeenCalledWith(
      '$env:http_proxy="http://127.0.0.1:1087"; $env:https_proxy="http://127.0.0.1:1087"',
    );

    await act(async () => {
      resolveAppInfo({
        name: "Term Proxy",
        version: "1.0.1",
        platform: "windows",
      });
    });
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

  it("disables an enabled proxy through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
    const { toast } = await import("sonner");
    vi.mocked(api.getProxyStore).mockResolvedValueOnce({
      proxies: [
        {
          id: "http-a",
          name: "Local HTTP",
          kind: "http_proxy",
          scheme: "http",
          host: "127.0.0.1",
          port: 1099,
          enabled: true,
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
    vi.mocked(api.disableProxyConfig).mockResolvedValueOnce({
      proxies: [
        {
          id: "http-a",
          name: "Local HTTP",
          kind: "http_proxy",
          scheme: "http",
          host: "127.0.0.1",
          port: 1099,
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

    await user.click(screen.getByRole("button", { name: "Disable Local HTTP" }));

    expect(api.disableProxyConfig).toHaveBeenCalledWith("http-a");
    expect(toast.success).toHaveBeenCalledWith("Proxy disabled");
  });

  it("enables a proxy and tells the user new terminals are updated automatically", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");
    const { toast } = await import("sonner");
    vi.mocked(api.getProxyStore).mockResolvedValueOnce({
      proxies: [
        {
          id: "http-a",
          name: "Local HTTP",
          kind: "http_proxy",
          scheme: "http",
          host: "127.0.0.1",
          port: 1099,
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
    vi.mocked(api.enableProxyConfig).mockResolvedValueOnce({
      proxies: [
        {
          id: "http-a",
          name: "Local HTTP",
          kind: "http_proxy",
          scheme: "http",
          host: "127.0.0.1",
          port: 1099,
          enabled: true,
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
          zsh: true,
          bash: true,
          powershell: false,
        },
      },
    });

    await renderApp();

    await user.click(screen.getByRole("button", { name: "Enable Local HTTP" }));

    expect(api.enableProxyConfig).toHaveBeenCalledWith("http-a");
    expect(toast.success).toHaveBeenCalledWith(
      "Proxy enabled. New terminals will use it automatically.",
    );
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

  it("syncs auto launch when saving settings", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");

    await renderApp();

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("switch", { name: "Launch at startup" }));
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(api.setAutoLaunch).toHaveBeenCalledWith(true);
    expect(api.saveProxyStore).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          autoLaunch: true,
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
