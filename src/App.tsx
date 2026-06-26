import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
    <main className="min-h-dvh bg-gradient-to-b from-background to-muted px-5 py-6 text-foreground md:px-8 md:py-8">
      <header className="mx-auto mb-6 flex max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="mb-1.5 text-sm text-muted-foreground">{t("app.subtitle")}</p>
          <h1 className="text-2xl font-semibold leading-tight">{t("app.title")}</h1>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {t("app.statusNotIntegrated")}
        </Badge>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
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
