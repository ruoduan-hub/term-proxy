import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CircleAlert, Settings2 } from "lucide-react";

import { ProxyDashboard } from "./features/proxies/ProxyDashboard";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import "./shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useTheme } from "@/shared/theme/ThemeProvider";
import {
  enableProxyConfig,
  getProxyStore,
  installShellIntegration,
  removeShellIntegration,
  saveProxyStore,
} from "@/shared/tauri/api";
import type {
  AppSettings,
  NewProxyConfig,
  ProxyConfig,
  ProxyStore,
  ShellKind,
} from "@/shared/types/proxy";

const defaultProxyStore: ProxyStore = {
  proxies: [],
  settings: {
    theme: "system",
    language: "system",
    autoLaunch: false,
    noProxy: "localhost,127.0.0.1",
    shellIntegration: {
      zsh: false,
      bash: false,
      powershell: false,
    },
  },
};

const supportedLanguages = ["zh-CN", "en", "ja", "zh-TW"] as const;

type SupportedLanguage = (typeof supportedLanguages)[number];
type AppView = "proxies" | "settings";

export function App() {
  const { t, i18n } = useTranslation();
  const { setTheme } = useTheme();
  const [store, setStore] = useState<ProxyStore>(defaultProxyStore);
  const [hasLoadedStore, setHasLoadedStore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>("proxies");
  const activeProxyCount = store.proxies.filter((proxy) => proxy.enabled).length;

  useEffect(() => {
    if (hasLoadedStore) {
      setTheme(store.settings.theme);
    }
  }, [hasLoadedStore, setTheme, store.settings.theme]);

  useEffect(() => {
    void i18n.changeLanguage(resolveLanguage(store.settings.language));
  }, [i18n, store.settings.language]);

  useEffect(() => {
    let isMounted = true;

    void getProxyStore()
      .then((nextStore) => {
        if (isMounted) {
          setStore(nextStore);
          setHasLoadedStore(true);
          setError(null);
        }
      })
      .catch((unknownError: unknown) => {
        if (isMounted) {
          setHasLoadedStore(true);
          setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAddProxy(proxy: NewProxyConfig) {
    const now = new Date().toISOString();
    const newProxy: ProxyConfig = {
      ...proxy,
      id: globalThis.crypto?.randomUUID?.() ?? `proxy-${Date.now()}`,
      enabled: false,
      createdAt: now,
      updatedAt: now,
    };

    const nextStore = {
      ...store,
      proxies: [...store.proxies, newProxy],
    };

    try {
      const savedStore = await saveProxyStore(nextStore);
      setStore(savedStore);
      setError(null);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    }
  }

  async function handleEnableProxy(id: string) {
    try {
      const nextStore = await enableProxyConfig(id);
      setStore(nextStore);
      setError(null);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    }
  }

  async function handleToggleShellIntegration(shell: ShellKind, enabled: boolean) {
    try {
      const nextStore = enabled
        ? await installShellIntegration(shell)
        : await removeShellIntegration(shell);
      setStore(nextStore);
      setError(null);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    }
  }

  async function handleSaveSettings(settings: AppSettings) {
    const nextStore = {
      ...store,
      settings,
    };

    try {
      const savedStore = await saveProxyStore(nextStore);
      setStore(savedStore);
      setError(null);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    }
  }

  return (
    <main className="min-h-dvh bg-background px-3 py-3 text-foreground sm:px-4">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-5xl flex-col">
        <header className="mb-3 flex h-11 items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="outline">{t("app.statusNotIntegrated")}</Badge>
            <Badge variant="secondary">{t("app.activeCount", { count: activeProxyCount })}</Badge>
          </div>
          {activeView === "settings" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("app.backToProxies")}
              onClick={() => setActiveView("proxies")}
            >
              <ArrowLeft aria-hidden="true" />
              <span>{t("app.backToProxies")}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("app.settings")}
              onClick={() => setActiveView("settings")}
            >
              <Settings2 aria-hidden="true" />
            </Button>
          )}
        </header>

        {activeView === "settings" ? (
          <div className="mx-auto w-full max-w-xl">
            {error ? (
              <div className="mb-3 flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={1.8}
                />
                <span>{error}</span>
              </div>
            ) : null}
            <SettingsPanel
              settings={store.settings}
              onSaveSettings={handleSaveSettings}
              onToggleShellIntegration={handleToggleShellIntegration}
            />
          </div>
        ) : (
          <div className="grid content-start gap-3">
            {error ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={1.8}
                />
                <span>{error}</span>
              </div>
            ) : null}
            <ProxyDashboard
              proxies={store.proxies}
              onAddProxy={handleAddProxy}
              onEnableProxy={handleEnableProxy}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function resolveLanguage(language: AppSettings["language"]): SupportedLanguage {
  if (isSupportedLanguage(language)) {
    return language;
  }

  const browserLanguage = globalThis.navigator?.language ?? "en";

  if (browserLanguage === "zh-TW" || browserLanguage === "zh-HK" || browserLanguage === "zh-MO") {
    return "zh-TW";
  }

  if (browserLanguage.startsWith("zh")) {
    return "zh-CN";
  }

  if (browserLanguage.startsWith("ja")) {
    return "ja";
  }

  return "en";
}

function isSupportedLanguage(language: AppSettings["language"]): language is SupportedLanguage {
  return supportedLanguages.some((supportedLanguage) => supportedLanguage === language);
}
