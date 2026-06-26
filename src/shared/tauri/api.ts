import { invoke } from "@tauri-apps/api/core";

import type { AppInfo } from "../types/proxy";

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("get_app_info");
}
