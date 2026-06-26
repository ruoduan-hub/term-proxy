import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { NewProxyConfig, ProxyConfig, ProxyKind, ProxyScheme } from "@/shared/types/proxy";

const proxyKinds = [
  { key: "http", value: "http_proxy" },
  { key: "https", value: "https_proxy" },
  { key: "all", value: "ALL_PROXY" },
] as const;

const DEFAULT_PROXY_SCHEME: ProxyScheme = "http";

type ProxyDashboardProps = {
  proxies: ProxyConfig[];
  onAddProxy: (proxy: NewProxyConfig) => void;
  onEnableProxy: (id: string) => void;
};

export function ProxyDashboard({ proxies, onAddProxy, onEnableProxy }: ProxyDashboardProps) {
  const { t } = useTranslation();
  const [selectedKind, setSelectedKind] = useState<ProxyKind>("http_proxy");
  const [isAdding, setIsAdding] = useState(false);

  const visibleProxies = proxies.filter((proxy) => proxy.kind === selectedKind);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    onAddProxy({
      name: String(data.get("name") ?? "").trim(),
      kind: selectedKind,
      scheme: DEFAULT_PROXY_SCHEME,
      host: String(data.get("host") ?? "").trim(),
      port: Number(data.get("port")),
    });

    event.currentTarget.reset();
    setIsAdding(false);
  }

  function handleKindChange(nextKind: string) {
    setSelectedKind(nextKind as ProxyKind);
  }

  return (
    <Card as="section" aria-labelledby="proxy-types-heading" className="overflow-hidden">
      <CardHeader className="items-start border-b border-border/65 bg-muted/28">
        <div className="min-w-0">
          <CardTitle id="proxy-types-heading">{t("proxy.types")}</CardTitle>
          <CardDescription className="mt-1">
            {visibleProxies.length > 0
              ? t("proxy.summary", { count: visibleProxies.length, kind: selectedKind })
              : t("proxy.emptyTitle")}
          </CardDescription>
        </div>
        <Button type="button" size="sm" onClick={() => setIsAdding((value) => !value)}>
          <Plus aria-hidden="true" />
          {t("proxy.add")}
        </Button>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={selectedKind} onValueChange={handleKindChange}>
          <TabsList aria-label={t("proxy.types")}>
            {proxyKinds.map((kind) => (
              <TabsTrigger key={kind.value} value={kind.value}>
                {t(`proxy.kind.${kind.key}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedKind}>
            {isAdding ? (
              <form
                className="mb-4 grid gap-3 rounded-lg border border-border/70 bg-muted/34 p-3"
                onSubmit={handleSubmit}
              >
                <div className="grid gap-2">
                  <Label htmlFor="proxy-name">{t("proxy.form.name")}</Label>
                  <Input id="proxy-name" name="name" required />
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                  <div className="grid gap-2">
                    <Label htmlFor="proxy-host">{t("proxy.form.host")}</Label>
                    <Input id="proxy-host" name="host" required />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="proxy-port">{t("proxy.form.port")}</Label>
                    <Input
                      id="proxy-port"
                      name="port"
                      type="number"
                      min={1}
                      max={65535}
                      defaultValue={1087}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    {t("proxy.form.save")}
                  </Button>
                </div>
              </form>
            ) : null}

            {visibleProxies.length > 0 ? (
              <div className="grid gap-3">
                {visibleProxies.map((proxy) => (
                  <article
                    key={proxy.id}
                    className="grid gap-3 rounded-lg border border-border/70 bg-background/72 p-3 transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-ring/35 dark:bg-secondary/20 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{proxy.name}</h3>
                        {proxy.enabled ? <Badge>{t("proxy.enabled")}</Badge> : null}
                      </div>
                      <p className="mt-1 truncate font-mono text-sm text-muted-foreground">
                        {`${proxy.scheme}://${proxy.host}:${proxy.port}`}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={proxy.enabled ? "secondary" : "outline"}
                      size="sm"
                      disabled={proxy.enabled}
                      aria-label={t("proxy.enableNamed", { name: proxy.name })}
                      onClick={() => onEnableProxy(proxy.id)}
                    >
                      {proxy.enabled ? t("proxy.enabled") : t("proxy.enable")}
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/32 p-5">
                <div className="mb-4 h-px w-12 bg-foreground/55" />
                <h3 className="mb-2 text-sm font-semibold tracking-[-0.01em]">
                  {t("proxy.emptyTitle")}
                </h3>
                <CardDescription className="max-w-[48ch]">
                  {t("proxy.emptyDescription")}
                </CardDescription>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
