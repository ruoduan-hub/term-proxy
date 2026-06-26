import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { disable, enable } from "@tauri-apps/plugin-autostart";

import type { AppInfo, ProxyStore } from "../types/proxy";

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("get_app_info");
}

export async function getProxyStore(): Promise<ProxyStore> {
  return invoke<ProxyStore>("get_proxy_store");
}

export async function copyText(text: string): Promise<void> {
  await writeText(text);
}

export async function saveProxyStore(store: ProxyStore): Promise<ProxyStore> {
  return invoke<ProxyStore>("save_proxy_store_command", { store });
}

export async function setAutoLaunch(enabled: boolean): Promise<void> {
  if (enabled) {
    await enable();
    return;
  }

  await disable();
}

export async function enableProxyConfig(id: string): Promise<ProxyStore> {
  return invoke<ProxyStore>("enable_proxy_config", { id });
}

export async function disableProxyConfig(id: string): Promise<ProxyStore> {
  return invoke<ProxyStore>("disable_proxy_config", { id });
}
