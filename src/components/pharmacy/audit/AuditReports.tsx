import { useMemo, useState } from "react";
import { ArrowDownToLine, Bell, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_REPORTS, type ReportDef } from "@/lib/audit";
import type { Audit, AuditCount, StockAdjustment, VarianceItem } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { downloadXls } from "@/lib/xls";
import { printHtml } from "@/lib/print";

export function AuditReports({
  audits,
  counts,
  variances,
  adjustments,
  onNotify,
}: {
  audits: Audit[];
  counts: AuditCount[];
  variances: VarianceItem[];
  adjustments: StockAdjustment[];
  onNotify: () => void;
}) {
  const reports = useMemo(
    () => ALL_REPORTS({ audits, counts, variances, adjustments }),
    [audits, counts, variances, adjustments],
  );
  const [selectedKey, setSelectedKey] = useState(reports[0]?.key ?? "");

  const selected: ReportDef | undefined = reports.find((r) => r.key === selectedKey) ?? reports[0];

  const printReport = (r: ReportDef) => {
    const rows = r.rows
      .map((row) => `<tr>${r.columns.map((c) => `<td>${String(row[c] ?? "")}</td>`).join("")}</tr>`)
      .join("");
    const headers = r.columns.map((c) => `<th>${c.replace(/_/g, " ")}</th>`).join("");
    printHtml(
      `<h2>${r.title}</h2><p>${r.description}</p><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selected?.key ?? ""} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select a report" />
            </SelectTrigger>
            <SelectContent>
              {reports.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selected && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCsv(`${selected.key}.csv`, selected.rows, selected.columns)}
            >
              <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadXls(`${selected.key}.xls`, selected.rows, selected.title)}
            >
              <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => printReport(selected)}>
              <Printer className="mr-1 h-3.5 w-3.5" /> Print
            </Button>
            <Button size="sm" variant="outline" onClick={onNotify}>
              <Bell className="mr-1 h-3.5 w-3.5" /> Schedule delivery
            </Button>
          </div>
        )}
      </div>

      {reports.map((r) => (
        <div
          key={r.key}
          className={cn(
            "rounded-xl border border-border bg-card p-4",
            selected?.key !== r.key && "hidden",
          )}
        >
          <div className="mb-3 flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{r.title}</h3>
              <p className="text-xs text-muted-foreground">{r.description}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.rows.length} rows</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  {r.columns.map((c) => (
                    <TableHead key={c}>{c.replace(/_/g, " ")}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.rows.slice(0, 50).map((row, i) => (
                  <TableRow key={i}>
                    {r.columns.map((c) => (
                      <TableCell key={c} className="text-xs">
                        {String(row[c] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {r.rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={r.columns.length}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No data for this report.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {r.rows.length > 50 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Preview shows the first 50 of {r.rows.length} rows — exports include everything.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
