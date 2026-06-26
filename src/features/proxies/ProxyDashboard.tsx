import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const proxyKinds = [
  { key: "http", value: "http_proxy" },
  { key: "https", value: "https_proxy" },
  { key: "all", value: "ALL_PROXY" },
] as const;

export function ProxyDashboard() {
  const { t } = useTranslation();

  return (
    <Card as="section" aria-labelledby="proxy-types-heading">
      <CardHeader>
        <CardTitle id="proxy-types-heading">{t("proxy.types")}</CardTitle>
        <Button type="button" size="sm">
          <Plus aria-hidden="true" />
          {t("proxy.add")}
        </Button>
      </CardHeader>

      <CardContent>
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={t("proxy.types")}>
          {proxyKinds.map((kind, index) => (
            <Button
              key={kind.value}
              type="button"
              role="tab"
              aria-selected={index === 0}
              variant={index === 0 ? "secondary" : "outline"}
              size="sm"
            >
              {t(`proxy.kind.${kind.key}`)}
            </Button>
          ))}
        </div>

        <div className="rounded-lg border border-dashed bg-muted p-5">
          <h3 className="mb-2 text-sm font-semibold">{t("proxy.emptyTitle")}</h3>
          <CardDescription>{t("proxy.emptyDescription")}</CardDescription>
        </div>
      </CardContent>
    </Card>
  );
}
