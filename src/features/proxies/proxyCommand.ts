import type { ProxyConfig, ProxyGroup, ProxyKind } from "@/shared/types/proxy";

type ProxyUrlParts = Pick<ProxyConfig, "scheme" | "host" | "port">;
type ProxyCopyParts = Pick<ProxyConfig, "kind" | "scheme" | "host" | "port">;

export const INVALID_PROXY_HOST_IPV4_ERROR = "invalid_proxy_host_ipv4";

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
  if (!isValidIpv4Address(proxy.host)) {
    throw new Error(INVALID_PROXY_HOST_IPV4_ERROR);
  }

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
