import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { AppSettings } from "@/shared/types/proxy";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

type SettingsPanelProps = {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void> | void;
};

const themeOptions: Array<{ value: AppSettings["theme"]; labelKey: string }> = [
  { value: "system", labelKey: "settings.themeOptions.system" },
  { value: "light", labelKey: "settings.themeOptions.light" },
  { value: "dark", labelKey: "settings.themeOptions.dark" },
];

const languageOptions: Array<{ value: AppSettings["language"]; labelKey: string }> = [
  { value: "system", labelKey: "settings.languageOptions.system" },
  { value: "zh-CN", labelKey: "settings.languageOptions.zhCN" },
  { value: "en", labelKey: "settings.languageOptions.en" },
  { value: "ja", labelKey: "settings.languageOptions.ja" },
  { value: "zh-TW", labelKey: "settings.languageOptions.zhTW" },
];

export function SettingsPanel({ settings, onSaveSettings }: SettingsPanelProps) {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<AppSettings["theme"]>(settings.theme);
  const [selectedLanguage, setSelectedLanguage] =
    useState<AppSettings["language"]>(settings.language);
  const [autoLaunch, setAutoLaunch] = useState(settings.autoLaunch);
  const [noProxy, setNoProxy] = useState(settings.noProxy);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    setSelectedLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    setAutoLaunch(settings.autoLaunch);
  }, [settings.autoLaunch]);

  useEffect(() => {
    setNoProxy(settings.noProxy);
  }, [settings.noProxy]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      await onSaveSettings({
        ...settings,
        theme: selectedTheme,
        language: selectedLanguage,
        autoLaunch,
        noProxy: noProxy.trim(),
      });
    } finally {
      setIsSaving(false);
    }
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
          <div className="grid gap-4">
            <div className="grid max-w-[18rem] gap-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t("settings.theme")}
              </div>
              <Tabs
                value={selectedTheme}
                onValueChange={(value) => handleThemeChange(value as AppSettings["theme"])}
              >
                <TabsList aria-label={t("settings.theme")} className="grid grid-cols-3">
                  {themeOptions.map((option) => (
                    <TabsTrigger key={option.value} value={option.value} className="min-w-0 px-2">
                      {t(option.labelKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="grid max-w-[32rem] gap-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t("settings.language")}
              </div>
              <Tabs
                value={selectedLanguage}
                onValueChange={(value) =>
                  setSelectedLanguage(value as AppSettings["language"])
                }
              >
                <TabsList
                  aria-label={t("settings.language")}
                  className="grid grid-cols-2 sm:grid-cols-5"
                >
                  {languageOptions.map((option) => (
                    <TabsTrigger key={option.value} value={option.value} className="min-w-0 px-2">
                      {t(option.labelKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex min-h-10 max-w-[18rem] items-center justify-between gap-3 rounded-md border border-border/70 bg-background px-3 py-2 dark:bg-secondary/20">
              <Label htmlFor="settings-auto-launch" className="text-sm">
                {t("settings.autoLaunch")}
              </Label>
              <Switch
                id="settings-auto-launch"
                aria-label={t("settings.autoLaunch")}
                checked={autoLaunch}
                onCheckedChange={setAutoLaunch}
              />
            </div>
            <div className="grid max-w-[32rem] gap-1">
              <Label htmlFor="settings-no-proxy">{t("settings.noProxy")}</Label>
              <Textarea
                id="settings-no-proxy"
                value={noProxy}
                className="font-mono"
                rows={4}
                onChange={(event) => setNoProxy(event.currentTarget.value)}
              />
            </div>
          </div>
          <div>
            <Button type="submit" size="sm" disabled={isSaving}>
              {t("settings.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
