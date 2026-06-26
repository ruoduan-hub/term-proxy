import { useTranslation } from "react-i18next";

import { ImportNotice } from "./features/import/ImportNotice";
import { ProxyDashboard } from "./features/proxies/ProxyDashboard";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import "./shared/i18n";
import "./App.css";

export function App() {
  const { t } = useTranslation();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">{t("app.subtitle")}</p>
          <h1>{t("app.title")}</h1>
        </div>
        <span className="app-status">{t("app.statusNotIntegrated")}</span>
      </header>

      <div className="app-grid">
        <div className="main-column">
          <ProxyDashboard />
          <ImportNotice />
        </div>
        <SettingsPanel />
      </div>
    </main>
  );
}
