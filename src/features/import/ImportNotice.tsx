import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function ImportNotice() {
  const { t } = useTranslation();

  return (
    <Card as="section" aria-labelledby="import-heading" className="bg-card/72">
      <CardHeader className="pb-3">
        <CardTitle id="import-heading">{t("import.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="max-w-[64ch]">{t("import.description")}</CardDescription>
      </CardContent>
    </Card>
  );
}
