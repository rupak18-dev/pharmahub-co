import { useMemo } from "react";
import { Banknote, Download, FileSpreadsheet, FileText, Landmark, RotateCcw } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { EmptyState } from "@/Components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { downloadXls } from "@/lib/xls";
import { toast } from "sonner";
import { format } from "date-fns";
const CN_STYLES = {
  expected: "border-warning/40 bg-warning/15 text-warning-foreground",
  received: "border-info/40 bg-info/15 text-info",
  reconciled: "border-success/40 bg-success/15 text-success",
};
export function ExpiryLedgers({ writeOffs, creditNotes, currency, onMarkReceived, onReconcile }) {
  const totals = useMemo(() => {
    const wo = writeOffs.reduce(
      (acc, w) => ({
        units: acc.units + w.units,
        costValue: acc.costValue + w.costValue,
        gstAmount: acc.gstAmount + w.gstAmount,
        total: acc.total + w.total,
      }),
      { units: 0, costValue: 0, gstAmount: 0, total: 0 },
    );
    const pending = creditNotes
      .filter((c) => c.status === "expected")
      .reduce((s, c) => s + c.value, 0);
    const received = creditNotes
      .filter((c) => c.status === "received")
      .reduce((s, c) => s + c.value, 0);
    const reconciled = creditNotes
      .filter((c) => c.status === "reconciled")
      .reduce((s, c) => s + c.value, 0);
    return { wo, pending, received, reconciled };
  }, [writeOffs, creditNotes]);
  const writeOffsData = () =>
    writeOffs.map((w) => ({
      date: w.createdAt.slice(0, 10),
      medicine: w.medicineName,
      batch: w.batchNumber,
      units: w.units,
      unitCost: w.unitCost,
      costValue: w.costValue,
      gstRate: w.gstRate,
      gstAmount: w.gstAmount,
      total: w.total,
      reason: w.reason,
      by: w.doneByName,
    }));
  const exportWriteOffs = (format) => {
    if (format === "csv") {
      downloadCsv(`gst-writeoff-ledger-${Date.now()}.csv`, writeOffsData());
    } else {
      downloadXls(`gst-writeoff-ledger-${Date.now()}.xls`, writeOffsData(), "Write-offs");
    }
    toast.success(`GST write-off ledger exported as ${format.toUpperCase()}`);
  };
  const creditNotesData = () =>
    creditNotes.map((c) => ({
      date: c.createdAt.slice(0, 10),
      supplier: c.supplierName,
      medicine: c.medicineName,
      batch: c.batchNumber,
      units: c.units,
      value: c.value,
      expectedBy: c.expectedBy.slice(0, 10),
      status: c.status,
      creditNoteNo: c.creditNoteNo ?? "",
    }));
  const exportCreditNotes = (format) => {
    if (format === "csv") {
      downloadCsv(`credit-note-reconciliation-${Date.now()}.csv`, creditNotesData());
    } else {
      downloadXls(
        `credit-note-reconciliation-${Date.now()}.xls`,
        creditNotesData(),
        "Credit notes",
      );
    }
    toast.success(`Credit-note reconciliation exported as ${format.toUpperCase()}`);
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total written off</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {currency}
            {totals.wo.costValue.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{totals.wo.units} units</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">GST adjustment</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {currency}
            {totals.wo.gstAmount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">posted to ledger</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Credit notes expected</p>
          <p className="mt-1 font-mono text-xl font-semibold text-warning-foreground">
            {currency}
            {totals.pending.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">awaiting supplier</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Recovered</p>
          <p className="mt-1 font-mono text-xl font-semibold text-success">
            {currency}
            {(totals.received + totals.reconciled).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">received + reconciled</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold">GST write-off ledger</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Export as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportWriteOffs("csv")}>
                <FileText className="h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportWriteOffs("xls")}>
                <FileSpreadsheet className="h-4 w-4" /> Excel (.xls)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {writeOffs.length === 0 ? (
          <EmptyState
            title="No write-offs yet"
            description="Dispose expired stock to post GST write-off entries here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Date</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="hidden md:table-cell">Batch</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden lg:table-cell">Written off by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {writeOffs.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(w.createdAt), "d MMM, HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{w.medicineName}</TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">
                      {w.batchNumber}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{w.units}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {currency}
                      {w.costValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-destructive">
                      {currency}
                      {w.gstAmount.toLocaleString()} ({w.gstRate}%)
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold">
                      {currency}
                      {w.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {w.doneByName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-info" />
            <h3 className="text-sm font-semibold">Credit-note reconciliation</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Export as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportCreditNotes("csv")}>
                <FileText className="h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCreditNotes("xls")}>
                <FileSpreadsheet className="h-4 w-4" /> Excel (.xls)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {creditNotes.length === 0 ? (
          <EmptyState
            title="No returns yet"
            description="Create a return and its expected credit note will appear here for reconciliation."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Returned</TableHead>
                  <TableHead className="hidden md:table-cell">Supplier</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Expected by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditNotes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(c.createdAt), "d MMM")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{c.supplierName}</TableCell>
                    <TableCell className="font-medium">
                      {c.medicineName}
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        {c.batchNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {currency}
                      {c.value.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {c.expectedBy ? format(new Date(c.expectedBy), "d MMM") : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${CN_STYLES[c.status]}`}
                      >
                        {c.status}
                        {c.creditNoteNo && <span className="font-mono">· {c.creditNoteNo}</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {c.status === "expected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              const no = window.prompt("Supplier credit-note number:");
                              onMarkReceived(c.id, no?.trim() || undefined);
                            }}
                          >
                            Mark received
                          </Button>
                        )}
                        {c.status === "received" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onReconcile(c.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" /> Reconcile
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
