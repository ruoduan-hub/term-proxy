import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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
  saveProxyStore: vi.fn(async (store) => store),
}));

describe("App", () => {
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
});
