export type ProxyKind = "http_proxy" | "https_proxy" | "ALL_PROXY";

export type ProxyScheme = "http" | "https" | "socks4" | "socks5";

export type ProxyConfig = {
  id: string;
  name: string;
  kind: ProxyKind;
  scheme: ProxyScheme;
  host: string;
  port: number;
  username?: string;
  password?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
};
