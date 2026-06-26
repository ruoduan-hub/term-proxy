import { useTranslation } from "react-i18next";

export function SettingsPanel() {
  const { t } = useTranslation();

  return (
    <aside className="panel settings-panel" aria-labelledby="settings-heading">
      <h2 id="settings-heading">{t("settings.title")}</h2>
      <dl>
        <div>
          <dt>{t("settings.theme")}</dt>
          <dd>System</dd>
        </div>
        <div>
          <dt>{t("settings.language")}</dt>
          <dd>System</dd>
        </div>
        <div>
          <dt>{t("settings.autoLaunch")}</dt>
          <dd>Off</dd>
        </div>
        <div>
          <dt>{t("settings.noProxy")}</dt>
          <dd>localhost, 127.0.0.1</dd>
        </div>
      </dl>
    </aside>
  );
}
