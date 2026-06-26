import { invoke } from "@tauri-apps/api/core";

import type { AppInfo, ProxyImportCandidate, ProxyStore, ShellKind } from "../types/proxy";

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("get_app_info");
}

export async function getProxyStore(): Promise<ProxyStore> {
  return invoke<ProxyStore>("get_proxy_store");
}

export async function scanProxyImports(): Promise<ProxyImportCandidate[]> {
  return invoke<ProxyImportCandidate[]>("scan_proxy_imports");
}

export async function saveProxyStore(store: ProxyStore): Promise<ProxyStore> {
  return invoke<ProxyStore>("save_proxy_store_command", { store });
}

export async function enableProxyConfig(id: string): Promise<ProxyStore> {
  return invoke<ProxyStore>("enable_proxy_config", { id });
}

export async function installShellIntegration(shell: ShellKind): Promise<ProxyStore> {
  return invoke<ProxyStore>("install_shell_integration", { shell });
}

export async function removeShellIntegration(shell: ShellKind): Promise<ProxyStore> {
  return invoke<ProxyStore>("remove_shell_integration", { shell });
}
