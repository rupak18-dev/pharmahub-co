import { useEffect, useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reportService } from "@/lib/reportService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

export function SourceDataDialog({ source, onOpenChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    reportService
      .getSourceData(source.key)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.message ?? "Failed to load source data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const isMoneyColumn = (colIndex) => {
    const names = data?.columns ?? [];
    return /total|amount|price|value|gst/i.test(names[colIndex] ?? "");
  };

  const formatCell = (value, colIndex) => {
    if (value === null || value === undefined || value === "") return "—";
    if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
      try {
        return new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch {
        return String(value);
      }
    }
    if (isMoneyColumn(colIndex) && typeof value === "number") {
      return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    }
    return String(value);
  };

  return (
    <Dialog open={!!source} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            {source?.name ?? "Report Data Source"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {source?.description ?? ""} Read-only preview of the latest records (up to 100).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          {!loading && data && (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {data.columns.map((c, i) => (
                    <TableHead
                      key={i}
                      className="text-[10px] uppercase tracking-wide whitespace-nowrap"
                    >
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={data.columns.length} className="py-10 text-center">
                      <p className="text-sm text-muted-foreground">No records found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((row, rIdx) => (
                    <TableRow key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <TableCell key={cIdx} className="text-xs text-foreground whitespace-nowrap">
                          {formatCell(cell, cIdx)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
