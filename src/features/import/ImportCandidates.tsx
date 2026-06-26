import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import type { ProxyImportCandidate } from "@/shared/types/proxy";

type ImportCandidatesProps = {
  candidates: ProxyImportCandidate[];
  onImportCandidate: (candidate: ProxyImportCandidate) => void;
};

export function ImportCandidates({ candidates, onImportCandidate }: ImportCandidatesProps) {
  const { t } = useTranslation();

  if (candidates.length === 0) {
    return null;
  }

  return (
    <Card as="section" aria-labelledby="import-candidates-heading" className="overflow-hidden">
      <CardHeader className="items-start border-b border-border/65 bg-muted/28">
        <div className="min-w-0">
          <CardTitle id="import-candidates-heading">{t("import.title")}</CardTitle>
          <CardDescription className="mt-1">{t("import.description")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className="grid gap-3 rounded-lg border border-border/70 bg-background/72 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold">{candidate.name}</div>
              <div className="mt-1 truncate font-mono text-sm text-muted-foreground">
                {`${candidate.scheme}://${candidate.host}:${candidate.port}`}
              </div>
              <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {`${candidate.sourcePath}:${candidate.lineNumber}`}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={t("import.importNamed", { name: candidate.name })}
              onClick={() => onImportCandidate(candidate)}
            >
              <Download aria-hidden="true" />
              {t("import.import")}
            </Button>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
