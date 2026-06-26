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
    expect(screen.queryByText("Import existing proxy")).not.toBeInTheDocument();
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
