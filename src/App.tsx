import { useTranslation } from "react-i18next";

import { ImportNotice } from "./features/import/ImportNotice";
import { ProxyDashboard } from "./features/proxies/ProxyDashboard";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import "./shared/i18n";
import { Badge } from "@/shared/ui/badge";

export function App() {
  const { t } = useTranslation();

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
          <ProxyDashboard />
          <ImportNotice />
        </div>
        <SettingsPanel />
      </div>
    </main>
  );
}
