import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleAlert, Terminal } from "lucide-react";

import { ImportNotice } from "./features/import/ImportNotice";
import { ProxyDashboard } from "./features/proxies/ProxyDashboard";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import "./shared/i18n";
import { Badge } from "@/shared/ui/badge";
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

export function App() {
  const { t, i18n } = useTranslation();
  const { setTheme } = useTheme();
  const [store, setStore] = useState<ProxyStore>(defaultProxyStore);
  const [hasLoadedStore, setHasLoadedStore] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    <main className="min-h-dvh bg-background px-4 py-4 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-7xl flex-col">
        <header className="mb-4 flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/88 px-4 py-3.5 shadow-[0_24px_80px_-66px_rgba(15,23,42,0.52),inset_0_1px_0_rgba(255,255,255,0.72)] sm:flex-row sm:items-center sm:justify-between dark:shadow-[0_24px_90px_-66px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-[0_14px_32px_-24px_rgba(15,23,42,0.65)] dark:bg-foreground dark:text-background">
              <Terminal aria-hidden="true" className="size-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold leading-tight tracking-[-0.02em]">
                {t("app.title")}
              </h1>
              <p className="truncate text-sm text-muted-foreground">{t("app.subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("app.statusNotIntegrated")}</Badge>
            <Badge variant="secondary">{t("app.activeCount", { count: activeProxyCount })}</Badge>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid content-start gap-4">
            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
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
            <ImportNotice />
          </div>
          <SettingsPanel
            settings={store.settings}
            onSaveSettings={handleSaveSettings}
            onToggleShellIntegration={handleToggleShellIntegration}
          />
        </div>
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
