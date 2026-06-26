import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { AppSettings, ShellKind } from "@/shared/types/proxy";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

type SettingsPanelProps = {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void> | void;
  onToggleShellIntegration: (shell: ShellKind, enabled: boolean) => Promise<void> | void;
};

const shellOptions: Array<{ kind: ShellKind; label: string }> = [
  { kind: "zsh", label: "zsh" },
  { kind: "bash", label: "bash" },
  { kind: "powershell", label: "PowerShell" },
];

export function SettingsPanel({
  settings,
  onSaveSettings,
  onToggleShellIntegration,
}: SettingsPanelProps) {
  const { t } = useTranslation();
  const [noProxy, setNoProxy] = useState(settings.noProxy);

  useEffect(() => {
    setNoProxy(settings.noProxy);
  }, [settings.noProxy]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSaveSettings({
      ...settings,
      noProxy: noProxy.trim(),
    });
  }

  return (
    <Card as="aside" aria-labelledby="settings-heading">
      <CardHeader>
        <CardTitle id="settings-heading">{t("settings.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <dl className="grid gap-4">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-muted-foreground">{t("settings.theme")}</dt>
              <dd className="text-sm font-medium">{settings.theme}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-muted-foreground">{t("settings.language")}</dt>
              <dd className="text-sm font-medium">{settings.language}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-muted-foreground">{t("settings.autoLaunch")}</dt>
              <dd className="text-sm font-medium">
                {settings.autoLaunch ? t("settings.on") : t("settings.off")}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt>
                <label className="text-sm text-muted-foreground" htmlFor="settings-no-proxy">
                  {t("settings.noProxy")}
                </label>
              </dt>
              <dd>
                <input
                  id="settings-no-proxy"
                  value={noProxy}
                  className="h-9 w-full rounded-md border bg-background px-3 font-mono text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  onChange={(event) => setNoProxy(event.currentTarget.value)}
                />
              </dd>
            </div>
            <div className="grid gap-3 border-t pt-4">
              <dt className="text-sm text-muted-foreground">{t("settings.shellIntegration")}</dt>
              <dd className="grid gap-2">
                {shellOptions.map(({ kind, label }) => {
                  const enabled = settings.shellIntegration[kind];

                  return (
                    <button
                      key={kind}
                      type="button"
                      role="switch"
                      aria-label={label}
                      aria-checked={enabled}
                      className="flex min-h-10 items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      onClick={() => void onToggleShellIntegration(kind, !enabled)}
                    >
                      <span className="font-mono text-sm font-medium">{label}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          enabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {enabled ? t("settings.on") : t("settings.off")}
                      </span>
                    </button>
                  );
                })}
              </dd>
            </div>
          </dl>
          <div>
            <Button type="submit" size="sm">
              {t("settings.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
