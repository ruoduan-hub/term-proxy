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

  it("rejects non-IPv4 proxy hosts when formatting copy commands", () => {
    expect(() => formatProxyCopyCommand(proxy({ host: "localhost" }), "macos")).toThrow(
      "invalid_proxy_host_ipv4",
    );
    expect(() => formatProxyCopyCommand(proxy({ host: "proxy.local" }), "windows")).toThrow(
      "invalid_proxy_host_ipv4",
    );
  });

  it("rejects stored IPv4 hosts with trailing whitespace when formatting copy commands", () => {
    expect(() => formatProxyCopyCommand(proxy({ host: "127.0.0.1 " }), "macos")).toThrow(
      "invalid_proxy_host_ipv4",
    );
    expect(() => formatProxyCopyCommand(proxy({ host: "127.0.0.1\n" }), "windows")).toThrow(
      "invalid_proxy_host_ipv4",
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
