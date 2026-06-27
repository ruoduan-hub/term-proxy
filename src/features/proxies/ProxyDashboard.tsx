import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Pencil, Plus, Trash2, X } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type {
  NewProxyConfig,
  ProxyConfig,
  ProxyGroup,
  ProxyKind,
  ProxyScheme,
} from "@/shared/types/proxy";

const proxyGroups = [
  { key: "http", value: "HTTP_PROXY" },
  { key: "all", value: "ALL_PROXY" },
] as const;

const DEFAULT_PROXY_SCHEME: ProxyScheme = "http";
const PROXY_NAME_MAX_LENGTH = 30;
const IPV4_ADDRESS_PATTERN =
  "((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";

type ProxyDashboardProps = {
  proxies: ProxyConfig[];
  onAddProxy: (proxy: NewProxyConfig) => Promise<void> | void;
  onEnableProxy: (id: string) => void;
  onDisableProxy: (id: string) => void;
  onUpdateProxy: (id: string, proxy: EditableProxyConfig) => Promise<void> | void;
  onDeleteProxy: (id: string) => void;
  onCopyProxyUrl: (url: string) => void;
};

type EditableProxyConfig = Pick<ProxyConfig, "name" | "host" | "port">;

function normalizeProxyName(name: FormDataEntryValue | null) {
  return String(name ?? "")
    .trim()
    .slice(0, PROXY_NAME_MAX_LENGTH);
}

export function ProxyDashboard({
  proxies,
  onAddProxy,
  onEnableProxy,
  onDisableProxy,
  onUpdateProxy,
  onDeleteProxy,
  onCopyProxyUrl,
}: ProxyDashboardProps) {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<ProxyGroup>("HTTP_PROXY");
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [submittingEditId, setSubmittingEditId] = useState<string | null>(null);
  const [editingProxyId, setEditingProxyId] = useState<string | null>(null);

  const visibleProxies = proxies.filter((proxy) => proxyGroupForKind(proxy.kind) === selectedGroup);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const form = event.currentTarget;

    try {
      setIsSubmittingAdd(true);
      await onAddProxy({
        name: normalizeProxyName(data.get("name")),
        kind: kindForProxyGroup(selectedGroup),
        scheme: DEFAULT_PROXY_SCHEME,
        host: String(data.get("host") ?? "").trim(),
        port: Number(data.get("port")),
      });

      form.reset();
      setIsAdding(false);
    } finally {
      setIsSubmittingAdd(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    try {
      setSubmittingEditId(id);
      await onUpdateProxy(id, {
        name: normalizeProxyName(data.get("name")),
        host: String(data.get("host") ?? "").trim(),
        port: Number(data.get("port")),
      });

      setEditingProxyId(null);
    } finally {
      setSubmittingEditId(null);
    }
  }

  function handleGroupChange(nextGroup: string) {
    setSelectedGroup(nextGroup as ProxyGroup);
    setEditingProxyId(null);
    setSubmittingEditId(null);
    setIsAdding(false);
    setIsSubmittingAdd(false);
  }

  function proxyUrl(proxy: ProxyConfig) {
    return `${proxy.scheme}://${proxy.host}:${proxy.port}`;
  }

  return (
    <Card as="section" aria-labelledby="proxy-types-heading" className="overflow-hidden">
      <CardHeader className="items-start border-b border-border/65 bg-muted/28">
        <div className="min-w-0">
          <CardTitle id="proxy-types-heading">{t("proxy.types")}</CardTitle>
          <CardDescription className="mt-1">
            {visibleProxies.length > 0
              ? t("proxy.summary", { count: visibleProxies.length, kind: selectedGroup })
              : t("proxy.emptyTitle")}
          </CardDescription>
        </div>
        <Button type="button" size="sm" onClick={() => setIsAdding((value) => !value)}>
          <Plus aria-hidden="true" />
          {t("proxy.add")}
        </Button>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={selectedGroup} onValueChange={handleGroupChange}>
          <TabsList aria-label={t("proxy.types")}>
            {proxyGroups.map((group) => (
              <TabsTrigger key={group.value} value={group.value}>
                {t(`proxy.kind.${group.key}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedGroup}>
            {isAdding ? (
              <form
                className="mb-4 grid gap-3 rounded-lg border border-border/70 bg-muted/34 p-3"
                onSubmit={handleSubmit}
              >
                <div className="grid gap-2">
                  <Label htmlFor="proxy-name">{t("proxy.form.name")}</Label>
                  <Input
                    id="proxy-name"
                    name="name"
                    maxLength={PROXY_NAME_MAX_LENGTH}
                    required
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                  <div className="grid gap-2">
                    <Label htmlFor="proxy-host">{t("proxy.form.host")}</Label>
                    <Input
                      id="proxy-host"
                      name="host"
                      inputMode="decimal"
                      pattern={IPV4_ADDRESS_PATTERN}
                      title={t("proxy.form.hostIpTitle")}
                      required
                    />
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
                  <Button type="submit" size="sm" disabled={isSubmittingAdd}>
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
                    className="rounded-lg border border-border/70 bg-background/72 p-3 transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-ring/35 dark:bg-secondary/20"
                  >
                    {editingProxyId === proxy.id ? (
                      <form
                        className="grid gap-3"
                        onSubmit={(event) => handleEditSubmit(event, proxy.id)}
                      >
                        <div className="grid gap-2">
                          <Label htmlFor={`proxy-name-${proxy.id}`}>{t("proxy.form.name")}</Label>
                          <Input
                            id={`proxy-name-${proxy.id}`}
                            name="name"
                            defaultValue={proxy.name}
                            maxLength={PROXY_NAME_MAX_LENGTH}
                            required
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                          <div className="grid gap-2">
                            <Label htmlFor={`proxy-host-${proxy.id}`}>
                              {t("proxy.form.host")}
                            </Label>
                            <Input
                              id={`proxy-host-${proxy.id}`}
                              name="host"
                              defaultValue={proxy.host}
                              inputMode="decimal"
                              pattern={IPV4_ADDRESS_PATTERN}
                              title={t("proxy.form.hostIpTitle")}
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`proxy-port-${proxy.id}`}>
                              {t("proxy.form.port")}
                            </Label>
                            <Input
                              id={`proxy-port-${proxy.id}`}
                              name="port"
                              type="number"
                              min={1}
                              max={65535}
                              defaultValue={proxy.port}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={t("proxy.cancelEditNamed", { name: proxy.name })}
                            disabled={submittingEditId === proxy.id}
                            onClick={() => setEditingProxyId(null)}
                          >
                            <X aria-hidden="true" />
                            {t("proxy.cancel")}
                          </Button>
                          <Button type="submit" size="sm" disabled={submittingEditId === proxy.id}>
                            {t("proxy.form.save")}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold">{proxy.name}</h3>
                            {proxy.enabled ? <Badge>{t("proxy.enabled")}</Badge> : null}
                          </div>
                          <p className="mt-1 truncate font-mono text-sm text-muted-foreground">
                            {proxyUrl(proxy)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("proxy.copyUrlNamed", { name: proxy.name })}
                            onClick={() => onCopyProxyUrl(proxyUrl(proxy))}
                          >
                            <Copy aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant={proxy.enabled ? "secondary" : "outline"}
                            size="sm"
                            aria-label={
                              proxy.enabled
                                ? t("proxy.disableNamed", { name: proxy.name })
                                : t("proxy.enableNamed", { name: proxy.name })
                            }
                            onClick={() =>
                              proxy.enabled ? onDisableProxy(proxy.id) : onEnableProxy(proxy.id)
                            }
                          >
                            {proxy.enabled ? t("proxy.disable") : t("proxy.enable")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("proxy.editNamed", { name: proxy.name })}
                            onClick={() => {
                              setIsAdding(false);
                              setEditingProxyId(proxy.id);
                            }}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("proxy.deleteNamed", { name: proxy.name })}
                            onClick={() => onDeleteProxy(proxy.id)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    )}
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

function proxyGroupForKind(kind: ProxyKind): ProxyGroup {
  return kind === "ALL_PROXY" ? "ALL_PROXY" : "HTTP_PROXY";
}

function kindForProxyGroup(group: ProxyGroup): ProxyKind {
  return group === "ALL_PROXY" ? "ALL_PROXY" : "http_proxy";
}
