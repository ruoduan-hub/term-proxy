import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

import { App } from "./App";
import "./shared/i18n";

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
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("renders translated proxy management sections", async () => {
    const api = await import("./shared/tauri/api");

    render(<App />);

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());

    expect(screen.getByRole("heading", { name: "Term Proxy" })).toBeInTheDocument();
    expect(screen.getByText("Proxy types")).toBeInTheDocument();
    expect(screen.getByText("Import existing proxy")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add proxy" })).toBeInTheDocument();
    expect(screen.getByText("Shell integration")).toBeInTheDocument();
  });

  it("saves a new proxy through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");

    render(<App />);

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

    render(<App />);

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());
    await user.click(screen.getByRole("switch", { name: "zsh" }));

    expect(api.installShellIntegration).toHaveBeenCalledWith("zsh");
  });

  it("saves edited settings through the Tauri API", async () => {
    const user = userEvent.setup();
    const api = await import("./shared/tauri/api");

    render(<App />);

    await waitFor(() => expect(api.getProxyStore).toHaveBeenCalled());
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

    render(<App />);

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  });
});
