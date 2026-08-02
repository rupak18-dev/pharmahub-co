import { useMemo } from "react";
import { ArrowDownToLine, Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  highRiskCategories,
  recommendedReAudit,
  repeatedVariance,
  suggestedCycleCount,
  suspiciousActivity,
  topMismatchContribution,
  formatCurrency,
  type AuditInsightCard,
} from "@/lib/audit";
import type {
  Audit,
  AuditCount,
  Batch,
  Category,
  Medicine,
  StockAdjustment,
  VarianceItem,
} from "@/lib/types";

const TONE_CHIP: Record<string, string> = {
  success: "border-success/30 bg-success/10 text-success",
  info: "border-info/30 bg-info/10 text-info",
  warning: "border-warning/40 bg-warning/15 text-warning-foreground",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

function InsightSection({
  title,
  hint,
  cards,
}: {
  title: string;
  hint: string;
  cards: AuditInsightCard[];
}) {
  if (cards.length === 0) return null;
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{c.title}</p>
              <Badge className={cn("shrink-0 border", TONE_CHIP[c.tone])}>
                {c.tone === "danger"
                  ? "High risk"
                  : c.tone === "warning"
                    ? "Watch"
                    : c.tone === "info"
                      ? "Suggestion"
                      : "Healthy"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AuditInsights({
  audits,
  counts,
  variances,
  adjustments,
  batches,
  medicines,
  categories,
  currency,
  onAddToReports,
  onNotify,
}: {
  audits: Audit[];
  counts: AuditCount[];
  variances: VarianceItem[];
  adjustments: StockAdjustment[];
  batches: Batch[];
  medicines: Medicine[];
  categories: Category[];
  currency: string;
  onAddToReports: () => void;
  onNotify: () => void;
}) {
  const sections = useMemo(() => {
    const repeated = repeatedVariance(variances, audits);
    const riskCats = highRiskCategories(variances, medicines, categories);
    const suspicious = suspiciousActivity(variances, adjustments);
    const reAudit = recommendedReAudit(variances);
    const cycle = suggestedCycleCount(batches, audits, medicines);
    return {
      "Repeated variances": {
        hint: "Same medicine mismatching across multiple audits",
        cards: repeated,
      },
      "High-risk categories": {
        hint: "Where variance value concentrates by category",
        cards: riskCats,
      },
      "Suspicious activity": {
        hint: "Potential theft / billing errors flagged by reason code",
        cards: suspicious,
      },
      "Re-audit suggestions": { hint: "Unresolved lines worth re-counting", cards: reAudit },
      "Suggested cycle counts": { hint: "High-value batches never counted yet", cards: cycle },
    } as Record<string, { hint: string; cards: AuditInsightCard[] }>;
  }, [variances, audits, adjustments, medicines, categories, batches]);

  const pareto = useMemo(() => topMismatchContribution(variances, 5), [variances]);

  const allCards = Object.values(sections).flatMap((s) => s.cards);
  const totalCount = allCards.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold">Audit intelligence</p>
            <p className="text-xs text-muted-foreground">
              Heuristic signals computed from your audit history · {totalCount} insight(s) ·{" "}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                AI · Beta
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onAddToReports}>
            <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> Add to reports
          </Button>
          <Button size="sm" variant="outline" onClick={onNotify}>
            <Bell className="mr-1 h-3.5 w-3.5" /> Notify me
          </Button>
        </div>
      </div>

      {pareto.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Pareto — where variance comes from</h3>
          <p className="text-xs text-muted-foreground">
            Top {pareto.length} medicines share {pareto[pareto.length - 1]?.cumulativePct}% of all
            variance value
          </p>
          <div className="mt-3 space-y-3">
            {pareto.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="min-w-0 truncate font-medium">{p.name}</span>
                  <span className="shrink-0 font-mono text-muted-foreground">
                    {formatCurrency(p.value, currency)} · {p.pct}% · cum {p.cumulativePct}%
                  </span>
                </div>
                <Progress value={p.cumulativePct} />
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.entries(sections).map(([title, s]) => (
        <InsightSection key={title} title={title} hint={s.hint} cards={s.cards} />
      ))}

      {totalCount === 0 && (
        <div className="grid h-48 place-items-center rounded-xl border border-border bg-card text-center">
          <div>
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No signals yet</p>
            <p className="text-xs text-muted-foreground">
              Run a few audits and insights will appear here automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
