import { useTranslation } from "react-i18next";

const proxyKinds = [
  { key: "http", value: "http_proxy" },
  { key: "https", value: "https_proxy" },
  { key: "all", value: "ALL_PROXY" },
] as const;

export function ProxyDashboard() {
  const { t } = useTranslation();

  return (
    <section className="panel proxy-panel" aria-labelledby="proxy-types-heading">
      <div className="panel-header">
        <h2 id="proxy-types-heading">{t("proxy.types")}</h2>
      </div>

      <div className="proxy-kind-list" role="tablist" aria-label={t("proxy.types")}>
        {proxyKinds.map((kind, index) => (
          <button
            key={kind.value}
            type="button"
            role="tab"
            aria-selected={index === 0}
            className={index === 0 ? "is-active" : undefined}
          >
            {t(`proxy.kind.${kind.key}`)}
          </button>
        ))}
      </div>

      <div className="empty-state">
        <h3>{t("proxy.emptyTitle")}</h3>
        <p>{t("proxy.emptyDescription")}</p>
      </div>
    </section>
  );
}
