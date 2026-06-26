import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export function SettingsPanel() {
  const { t } = useTranslation();

  return (
    <Card as="aside" aria-labelledby="settings-heading">
      <CardHeader>
        <CardTitle id="settings-heading">{t("settings.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4">
          <div className="flex justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{t("settings.theme")}</dt>
            <dd className="text-sm font-medium">System</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{t("settings.language")}</dt>
            <dd className="text-sm font-medium">System</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{t("settings.autoLaunch")}</dt>
            <dd className="text-sm font-medium">Off</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm text-muted-foreground">{t("settings.noProxy")}</dt>
            <dd className="break-all font-mono text-sm font-medium">localhost, 127.0.0.1</dd>
          </div>
          <div className="grid gap-1 border-t pt-4">
            <dt className="text-sm text-muted-foreground">{t("settings.shellIntegration")}</dt>
            <dd className="text-sm font-medium">zsh / bash / PowerShell</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
