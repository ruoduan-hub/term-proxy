export type ProxyKind = "http_proxy" | "https_proxy" | "ALL_PROXY";

export type ProxyScheme = "http" | "https" | "socks4" | "socks5";

export type ShellKind = "zsh" | "bash" | "powershell";

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

export type NewProxyConfig = {
  name: string;
  kind: ProxyKind;
  scheme: ProxyScheme;
  host: string;
  port: number;
};

export type ShellIntegrationSettings = {
  zsh: boolean;
  bash: boolean;
  powershell: boolean;
};

export type AppSettings = {
  theme: "light" | "dark" | "system";
  language: "zh-CN" | "en" | "ja" | "zh-TW" | "system";
  autoLaunch: boolean;
  noProxy: string;
  shellIntegration: ShellIntegrationSettings;
};

export type ProxyStore = {
  proxies: ProxyConfig[];
  settings: AppSettings;
};

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
};
