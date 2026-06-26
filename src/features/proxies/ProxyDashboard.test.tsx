import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import "@/shared/i18n";
import type { ProxyConfig } from "@/shared/types/proxy";
import { ProxyDashboard } from "./ProxyDashboard";

function proxy(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    id: "http-a",
    name: "Local HTTP",
    kind: "http_proxy",
    scheme: "http",
    host: "127.0.0.1",
    port: 1087,
    enabled: false,
    createdAt: "2026-06-26T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
    ...overrides,
  };
}

describe("ProxyDashboard", () => {
  it("renders proxy rows and enables a proxy", async () => {
    const user = userEvent.setup();
    const onEnableProxy = vi.fn();

    render(
      <ProxyDashboard
        proxies={[
          proxy({ id: "http-a", enabled: true }),
          proxy({ id: "http-b", name: "Backup HTTP", host: "10.0.0.2" }),
        ]}
        onAddProxy={vi.fn()}
        onEnableProxy={onEnableProxy}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={vi.fn()}
      />,
    );

    expect(screen.getByText("Local HTTP")).toBeInTheDocument();
    expect(screen.getByText("Backup HTTP")).toBeInTheDocument();
    expect(screen.getByText("http://10.0.0.2:1087")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enable Backup HTTP" }));

    expect(onEnableProxy).toHaveBeenCalledWith("http-b");
  });

  it("submits a new proxy from the add form", async () => {
    const user = userEvent.setup();
    const onAddProxy = vi.fn();

    render(
      <ProxyDashboard
        proxies={[]}
        onAddProxy={onAddProxy}
        onEnableProxy={vi.fn()}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "ALL_PROXY" }));
    await user.click(screen.getByRole("button", { name: "Add proxy" }));

    expect(screen.queryByLabelText("Type")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scheme")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "Local SOCKS");
    await user.type(screen.getByLabelText("Host"), "127.0.0.1");
    await user.clear(screen.getByLabelText("Port"));
    await user.type(screen.getByLabelText("Port"), "1080");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(onAddProxy).toHaveBeenCalledWith({
      name: "Local SOCKS",
      kind: "ALL_PROXY",
      scheme: "http",
      host: "127.0.0.1",
      port: 1080,
    });
  });

  it("submits edited proxy values without changing the selected proxy type", async () => {
    const user = userEvent.setup();
    const onUpdateProxy = vi.fn();

    render(
      <ProxyDashboard
        proxies={[proxy({ id: "http-b", name: "Backup HTTP", host: "10.0.0.2" })]}
        onAddProxy={vi.fn()}
        onEnableProxy={vi.fn()}
        onUpdateProxy={onUpdateProxy}
        onDeleteProxy={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Backup HTTP" }));
    await user.clear(screen.getByLabelText("Host"));
    await user.type(screen.getByLabelText("Host"), "10.0.0.3");
    await user.clear(screen.getByLabelText("Port"));
    await user.type(screen.getByLabelText("Port"), "1088");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(screen.queryByLabelText("Type")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scheme")).not.toBeInTheDocument();
    expect(onUpdateProxy).toHaveBeenCalledWith("http-b", {
      name: "Backup HTTP",
      host: "10.0.0.3",
      port: 1088,
    });
  });

  it("deletes a proxy row", async () => {
    const user = userEvent.setup();
    const onDeleteProxy = vi.fn();

    render(
      <ProxyDashboard
        proxies={[proxy({ id: "http-b", name: "Backup HTTP" })]}
        onAddProxy={vi.fn()}
        onEnableProxy={vi.fn()}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={onDeleteProxy}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Backup HTTP" }));

    expect(onDeleteProxy).toHaveBeenCalledWith("http-b");
  });
});
