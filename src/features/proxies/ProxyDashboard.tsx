import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { NewProxyConfig, ProxyConfig, ProxyKind, ProxyScheme } from "@/shared/types/proxy";

const proxyKinds = [
  { key: "http", value: "http_proxy" },
  { key: "https", value: "https_proxy" },
  { key: "all", value: "ALL_PROXY" },
] as const;

const proxySchemes = ["http", "https", "socks4", "socks5"] as const;

type ProxyDashboardProps = {
  proxies: ProxyConfig[];
  onAddProxy: (proxy: NewProxyConfig) => void;
  onEnableProxy: (id: string) => void;
};

export function ProxyDashboard({ proxies, onAddProxy, onEnableProxy }: ProxyDashboardProps) {
  const { t } = useTranslation();
  const [selectedKind, setSelectedKind] = useState<ProxyKind>("http_proxy");
  const [isAdding, setIsAdding] = useState(false);
  const [newProxyKind, setNewProxyKind] = useState<ProxyKind>("http_proxy");
  const [newProxyScheme, setNewProxyScheme] = useState<ProxyScheme>("http");

  const visibleProxies = proxies.filter((proxy) => proxy.kind === selectedKind);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    onAddProxy({
      name: String(data.get("name") ?? "").trim(),
      kind: newProxyKind,
      scheme: newProxyScheme,
      host: String(data.get("host") ?? "").trim(),
      port: Number(data.get("port")),
    });

    event.currentTarget.reset();
    setIsAdding(false);
  }

  function handleKindChange(nextKind: string) {
    const proxyKind = nextKind as ProxyKind;
    setSelectedKind(proxyKind);
    setNewProxyKind(proxyKind);
  }

  return (
    <Card as="section" aria-labelledby="proxy-types-heading" className="overflow-hidden">
      <CardHeader className="items-start border-b border-border/65 bg-muted/38">
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

      <CardContent className="pt-5">
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
                className="mb-5 grid gap-4 rounded-2xl border border-border/70 bg-muted/44 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                onSubmit={handleSubmit}
              >
                <div className="grid gap-2">
                  <Label htmlFor="proxy-name">{t("proxy.form.name")}</Label>
                  <Input id="proxy-name" name="name" required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="proxy-kind">{t("proxy.form.type")}</Label>
                    <Select
                      value={newProxyKind}
                      onValueChange={(value) => setNewProxyKind(value as ProxyKind)}
                    >
                      <SelectTrigger id="proxy-kind">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {proxyKinds.map((kind) => (
                          <SelectItem key={kind.value} value={kind.value}>
                            {t(`proxy.kind.${kind.key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="proxy-scheme">{t("proxy.form.scheme")}</Label>
                    <Select
                      value={newProxyScheme}
                      onValueChange={(value) => setNewProxyScheme(value as ProxyScheme)}
                    >
                      <SelectTrigger id="proxy-scheme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {proxySchemes.map((scheme) => (
                          <SelectItem key={scheme} value={scheme}>
                            {scheme}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px]">
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
                    className="grid gap-3 rounded-2xl border border-border/70 bg-background/74 p-4 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.62)] transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-ring/35 dark:bg-secondary/24 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:grid-cols-[minmax(0,1fr)_auto]"
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
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/42 p-6">
                <div className="mb-4 h-px w-12 bg-primary/70" />
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
