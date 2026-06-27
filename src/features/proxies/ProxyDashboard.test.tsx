import { act, render, screen } from "@testing-library/react";
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
        onDisableProxy={vi.fn()}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={vi.fn()}
        onCopyProxyCommand={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "HTTP_PROXY" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ALL_PROXY" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "http_proxy" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "https_proxy" })).not.toBeInTheDocument();
    expect(screen.getByText("Local HTTP")).toBeInTheDocument();
    expect(screen.getByText("Backup HTTP")).toBeInTheDocument();
    expect(screen.getByText("http://10.0.0.2:1087")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enable Backup HTTP" }));

    expect(onEnableProxy).toHaveBeenCalledWith("http-b");
  });

  it("shows old https_proxy rows in the HTTP_PROXY group", () => {
    render(
      <ProxyDashboard
        proxies={[
          proxy({
            id: "https-a",
            name: "Legacy HTTPS",
            kind: "https_proxy",
            scheme: "https",
          }),
        ]}
        onAddProxy={vi.fn()}
        onEnableProxy={vi.fn()}
        onDisableProxy={vi.fn()}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={vi.fn()}
        onCopyProxyCommand={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "HTTP_PROXY" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Legacy HTTPS")).toBeInTheDocument();
    expect(screen.getByText("https://127.0.0.1:1087")).toBeInTheDocument();
  });

  it("disables an enabled proxy row", async () => {
    const user = userEvent.setup();
    const onDisableProxy = vi.fn();

    render(
      <ProxyDashboard
        proxies={[proxy({ id: "http-a", enabled: true })]}
        onAddProxy={vi.fn()}
        onEnableProxy={vi.fn()}
        onDisableProxy={onDisableProxy}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={vi.fn()}
        onCopyProxyCommand={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Disable Local HTTP" }));

    expect(onDisableProxy).toHaveBeenCalledWith("http-a");
  });

  it("submits a new HTTP_PROXY proxy from the add form", async () => {
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

    expect(screen.queryByLabelText("Type")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scheme")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "Local HTTP");
    await user.type(screen.getByLabelText("Host"), "127.0.0.1");
    await user.clear(screen.getByLabelText("Port"));
    await user.type(screen.getByLabelText("Port"), "1087");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(onAddProxy).toHaveBeenCalledWith({
      name: "Local HTTP",
      kind: "http_proxy",
      scheme: "http",
      host: "127.0.0.1",
      port: 1087,
    });
  });

  it("submits a new ALL_PROXY proxy from the add form", async () => {
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

    await user.click(screen.getByRole("tab", { name: "ALL_PROXY" }));
    await user.click(screen.getByRole("button", { name: "Add proxy" }));
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

  it("limits proxy names and accepts only IPv4 hosts in the add form", async () => {
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

    const name = screen.getByLabelText("Name");
    const host = screen.getByLabelText("Host");

    expect(name).toHaveAttribute("maxLength", "30");
    expect(host).toHaveAttribute("pattern");

    await user.type(name, "Invalid host");
    await user.type(host, "localhost");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(onAddProxy).not.toHaveBeenCalled();
  });

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

  it("disables the add form save button while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => {};
    const onAddProxy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

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
    await user.type(screen.getByLabelText("Host"), "127.0.0.1");
    await user.click(screen.getByRole("button", { name: "Save proxy" }));

    expect(screen.getByRole("button", { name: "Save proxy" })).toBeDisabled();

    await act(async () => {
      resolveSubmit();
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
        onDisableProxy={vi.fn()}
        onUpdateProxy={onUpdateProxy}
        onDeleteProxy={vi.fn()}
        onCopyProxyCommand={vi.fn()}
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

  it("limits proxy names and accepts only IPv4 hosts in the edit form", async () => {
    const user = userEvent.setup();

    render(
      <ProxyDashboard
        proxies={[proxy({ id: "http-b", name: "Backup HTTP", host: "10.0.0.2" })]}
        onAddProxy={vi.fn()}
        onEnableProxy={vi.fn()}
        onDisableProxy={vi.fn()}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={vi.fn()}
        onCopyProxyCommand={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Backup HTTP" }));

    expect(screen.getByLabelText("Name")).toHaveAttribute("maxLength", "30");
    expect(screen.getByLabelText("Host")).toHaveAttribute("pattern");
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

  it("deletes a proxy row", async () => {
    const user = userEvent.setup();
    const onDeleteProxy = vi.fn();

    render(
      <ProxyDashboard
        proxies={[proxy({ id: "http-b", name: "Backup HTTP" })]}
        onAddProxy={vi.fn()}
        onEnableProxy={vi.fn()}
        onDisableProxy={vi.fn()}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={onDeleteProxy}
        onCopyProxyCommand={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Backup HTTP" }));

    expect(onDeleteProxy).toHaveBeenCalledWith("http-b");
  });

  it("copies a proxy URL from a row", async () => {
    const user = userEvent.setup();
    const onCopyProxyCommand = vi.fn();

    render(
      <ProxyDashboard
        proxies={[proxy({ id: "http-b", name: "Backup HTTP", host: "10.0.0.2" })]}
        onAddProxy={vi.fn()}
        onEnableProxy={vi.fn()}
        onDisableProxy={vi.fn()}
        onUpdateProxy={vi.fn()}
        onDeleteProxy={vi.fn()}
        onCopyProxyCommand={onCopyProxyCommand}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy Backup HTTP URL" }));

    expect(onCopyProxyCommand).toHaveBeenCalledWith(
      proxy({ id: "http-b", name: "Backup HTTP", host: "10.0.0.2" }),
    );
  });
});
