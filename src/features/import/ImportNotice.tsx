import { useTranslation } from "react-i18next";

export function ImportNotice() {
  const { t } = useTranslation();

  return (
    <section className="panel import-panel" aria-labelledby="import-heading">
      <h2 id="import-heading">{t("import.title")}</h2>
      <p>{t("import.description")}</p>
    </section>
  );
}
