import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
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

  const visibleProxies = proxies.filter((proxy) => proxy.kind === selectedKind);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    onAddProxy({
      name: String(data.get("name") ?? "").trim(),
      kind: String(data.get("kind")) as ProxyKind,
      scheme: String(data.get("scheme")) as ProxyScheme,
      host: String(data.get("host") ?? "").trim(),
      port: Number(data.get("port")),
    });

    event.currentTarget.reset();
    setIsAdding(false);
  }

  return (
    <Card as="section" aria-labelledby="proxy-types-heading">
      <CardHeader>
        <CardTitle id="proxy-types-heading">{t("proxy.types")}</CardTitle>
        <Button type="button" size="sm" onClick={() => setIsAdding((value) => !value)}>
          <Plus aria-hidden="true" />
          {t("proxy.add")}
        </Button>
      </CardHeader>

      <CardContent>
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={t("proxy.types")}>
          {proxyKinds.map((kind) => (
            <Button
              key={kind.value}
              type="button"
              role="tab"
              aria-selected={selectedKind === kind.value}
              variant={selectedKind === kind.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedKind(kind.value)}
            >
              {t(`proxy.kind.${kind.key}`)}
            </Button>
          ))}
        </div>

        {isAdding ? (
          <form className="mb-5 grid gap-4 rounded-lg border bg-muted p-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="proxy-name">
                {t("proxy.form.name")}
              </label>
              <input
                id="proxy-name"
                name="name"
                required
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="proxy-kind">
                  {t("proxy.form.type")}
                </label>
                <select
                  id="proxy-kind"
                  name="kind"
                  defaultValue={selectedKind}
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {proxyKinds.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {t(`proxy.kind.${kind.key}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="proxy-scheme">
                  {t("proxy.form.scheme")}
                </label>
                <select
                  id="proxy-scheme"
                  name="scheme"
                  defaultValue="http"
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {proxySchemes.map((scheme) => (
                    <option key={scheme} value={scheme}>
                      {scheme}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px]">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="proxy-host">
                  {t("proxy.form.host")}
                </label>
                <input
                  id="proxy-host"
                  name="host"
                  required
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="proxy-port">
                  {t("proxy.form.port")}
                </label>
                <input
                  id="proxy-port"
                  name="port"
                  type="number"
                  min={1}
                  max={65535}
                  defaultValue={1087}
                  required
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
              </div>
            </div>

            <div>
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
                className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{proxy.name}</h3>
                    {proxy.enabled ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        {t("proxy.enabled")}
                      </span>
                    ) : null}
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
          <div className="rounded-lg border border-dashed bg-muted p-5">
            <h3 className="mb-2 text-sm font-semibold">{t("proxy.emptyTitle")}</h3>
            <CardDescription>{t("proxy.emptyDescription")}</CardDescription>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
