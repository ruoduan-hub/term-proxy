import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { AppSettings, ShellKind } from "@/shared/types/proxy";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { Switch } from "@/shared/ui/switch";

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
  const { setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<AppSettings["theme"]>(settings.theme);
  const [selectedLanguage, setSelectedLanguage] =
    useState<AppSettings["language"]>(settings.language);
  const [noProxy, setNoProxy] = useState(settings.noProxy);

  useEffect(() => {
    setSelectedTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    setSelectedLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    setNoProxy(settings.noProxy);
  }, [settings.noProxy]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSaveSettings({
      ...settings,
      theme: selectedTheme,
      language: selectedLanguage,
      noProxy: noProxy.trim(),
    });
  }

  function handleThemeChange(nextTheme: AppSettings["theme"]) {
    setSelectedTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <Card as="section" aria-labelledby="settings-heading" className="overflow-hidden">
      <CardHeader className="border-b border-border/65 bg-muted/28">
        <CardTitle id="settings-heading">{t("settings.title")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="settings-theme">{t("settings.theme")}</Label>
              <Select
                value={selectedTheme}
                onValueChange={(value) => handleThemeChange(value as AppSettings["theme"])}
              >
                <SelectTrigger id="settings-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">{t("settings.themeOptions.system")}</SelectItem>
                  <SelectItem value="light">{t("settings.themeOptions.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.themeOptions.dark")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="settings-language">{t("settings.language")}</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) =>
                  setSelectedLanguage(value as AppSettings["language"])
                }
              >
                <SelectTrigger id="settings-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">{t("settings.languageOptions.system")}</SelectItem>
                  <SelectItem value="zh-CN">{t("settings.languageOptions.zhCN")}</SelectItem>
                  <SelectItem value="en">{t("settings.languageOptions.en")}</SelectItem>
                  <SelectItem value="ja">{t("settings.languageOptions.ja")}</SelectItem>
                  <SelectItem value="zh-TW">{t("settings.languageOptions.zhTW")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-h-9 items-center justify-between gap-4 rounded-md border border-border/65 bg-muted/28 px-3 py-2">
              <span className="text-sm text-muted-foreground">{t("settings.autoLaunch")}</span>
              <span className="text-sm font-medium">
                {settings.autoLaunch ? t("settings.on") : t("settings.off")}
              </span>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="settings-no-proxy">{t("settings.noProxy")}</Label>
              <Input
                id="settings-no-proxy"
                value={noProxy}
                className="font-mono"
                onChange={(event) => setNoProxy(event.currentTarget.value)}
              />
            </div>
            <Separator />
            <div className="grid gap-3">
              <div className="text-sm font-medium text-muted-foreground">
                {t("settings.shellIntegration")}
              </div>
              <div className="grid gap-2">
                {shellOptions.map(({ kind, label }) => {
                  const enabled = settings.shellIntegration[kind];

                  return (
                    <div
                      key={kind}
                      className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border/70 bg-background px-3 py-2 dark:bg-secondary/20"
                    >
                      <Label className="font-mono text-sm" htmlFor={`shell-${kind}`}>
                        {label}
                      </Label>
                      <Switch
                        id={`shell-${kind}`}
                        aria-label={label}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          void onToggleShellIntegration(kind, checked)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
