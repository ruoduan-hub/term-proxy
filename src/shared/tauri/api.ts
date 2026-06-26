import { invoke } from "@tauri-apps/api/core";

import type { AppInfo, ProxyStore } from "../types/proxy";

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("get_app_info");
}

export async function getProxyStore(): Promise<ProxyStore> {
  return invoke<ProxyStore>("get_proxy_store");
}

export async function saveProxyStore(store: ProxyStore): Promise<ProxyStore> {
  return invoke<ProxyStore>("save_proxy_store_command", { store });
}

export async function enableProxyConfig(id: string): Promise<ProxyStore> {
  return invoke<ProxyStore>("enable_proxy_config", { id });
}
