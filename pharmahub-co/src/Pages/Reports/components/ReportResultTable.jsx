import { useMemo } from "react";
import { FileText, Table2 } from "lucide-react";
import { buildReportColumns } from "../reportBuilderState";
import { getGroupByLabel } from "../reportCatalog";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------
   REPORT RESULT TABLE
   The table is rendered from the selected configuration — group-by
   fields become grouping columns, summary fields become metric columns.
   No report layout is hardcoded. Because the backend is not connected,
   the table shows its correct schema with placeholder rows instead of
   fabricated values.
   --------------------------------------------------------------------- */

const PLACEHOLDER_ROWS = 4;

export default function ReportResultTable({ groupBy = [], summarize = [], previewed = false }) {
  const columns = useMemo(() => buildReportColumns(groupBy, summarize), [groupBy, summarize]);
  const hasGroups = groupBy.length > 0;

  if (!hasGroups) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileText className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No report data available yet</h3>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Configure your report and connect pharmacy data to generate results.
        </p>
      </div>
    );
  }

  if (!previewed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <Table2 className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">Ready to preview</h3>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Your configuration is set. Preview builds the table schema from the selected grouping and
          summaries.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 text-[11px] text-muted-foreground">
        <Table2 className="h-3.5 w-3.5 text-primary" />
        <span>
          Table structure —{" "}
          <span className="font-medium text-foreground">awaiting pharmacy data</span>
        </span>
        <span className="ml-auto font-mono text-[10px]">
          {groupBy.map(getGroupByLabel).join(" + ")}
          {summarize.length > 0 && " · "}
          {summarize.map((k) => columns.find((c) => c.key === k)?.label ?? k).join(" + ")}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="sticky top-0 border-b border-border bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-3.5 py-2.5 font-semibold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: PLACEHOLDER_ROWS }).map((_, ri) => (
                <tr key={ri} className="bg-background/40">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3.5 py-2 text-muted-foreground/60",
                        col.money && "text-right font-mono tabular-nums",
                      )}
                    >
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
        Structure preview only — no values shown. Connect pharmacy data to populate this report.
      </div>
    </div>
  );
}
