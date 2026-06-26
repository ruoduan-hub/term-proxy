import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function ImportNotice() {
  const { t } = useTranslation();

  return (
    <Card as="section" aria-labelledby="import-heading">
      <CardHeader>
        <CardTitle id="import-heading">{t("import.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{t("import.description")}</CardDescription>
      </CardContent>
    </Card>
  );
}
