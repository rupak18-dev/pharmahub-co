import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { reportService } from "@/lib/reportService";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { cn } from "@/lib/utils";

const STEPS = ["select", "review", "importing"];

const SALES_COLUMNS = [
  { key: "invoiceNo", label: "Bill Number", required: true },
  { key: "billDate", label: "Date", required: true },
  { key: "medicineName", label: "Medicine Name", required: true },
  { key: "quantity", label: "Quantity" },
  { key: "unitPrice", label: "Unit Price" },
  { key: "customerName", label: "Customer Name" },
  { key: "gstRate", label: "GST %" },
  { key: "paymentMode", label: "Payment Mode" },
];

const PURCHASE_COLUMNS = [
  { key: "invoiceNo", label: "Invoice Number", required: true },
  { key: "purchaseDate", label: "Date", required: true },
  { key: "medicineName", label: "Product Name", required: true },
  { key: "supplierName", label: "Supplier" },
  { key: "quantity", label: "Quantity" },
  { key: "unitCost", label: "Rate" },
  { key: "batchNumber", label: "Batch" },
  { key: "expiryDate", label: "Expiry" },
  { key: "hsnCode", label: "HSN" },
  { key: "sgstRate", label: "SGST %" },
  { key: "cgstRate", label: "CGST %" },
  { key: "gstRate", label: "GST %" },
];

export function ImportCsvModal({ open, onOpenChange, onImported, type = "auto" }) {
  const [side, setSide] = useState(type === "purchases" ? "purchases" : "sales");
  const isPurchase = type === "purchases" ? true : type === "sales" ? false : side === "purchases";
  const EXPECTED_COLUMNS = isPurchase ? PURCHASE_COLUMNS : SALES_COLUMNS;
  const fileInputRef = useRef(null);
  const [step, setStep] = useState("select");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const switchSide = (next) => {
    if (next === side) return;
    setSide(next);
    setStep("select");
    setCsvText("");
    setFileName("");
    setResult(null);
    setImportResult(null);
    setDuplicateMode("skip");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reset = () => {
    setStep("select");
    setCsvText("");
    setFileName("");
    setResult(null);
    setImportResult(null);
    setDuplicateMode("skip");
  };

  const pickFile = (selected) => {
    const f = selected?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setCsvText(String(reader.result ?? ""));
      setFileName(f.name);
      await validateCsv(String(reader.result ?? ""));
    };
    reader.onerror = () => toast.error("Could not read the CSV file.");
    reader.readAsText(f);
  };

  const validateCsv = async (text) => {
    if (!text.trim()) {
      toast.error("The file is empty.");
      return;
    }
    setValidating(true);
    try {
      const data = isPurchase
        ? await reportService.validatePurchaseImport(text)
        : await reportService.validateSalesImport(text);
      setResult(data);
      setStep("review");
      if (data.errorCount > 0) {
        toast.warning(
          `${data.errorCount} row${data.errorCount === 1 ? "" : "s"} have errors and will be skipped.`,
        );
      }
    } catch (err) {
      toast.error(err?.message ?? "CSV validation failed.");
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;
    setImporting(true);
    setStep("importing");
    try {
      const validRows = result.preview.filter((r) => r.valid);
      const data = isPurchase
        ? await reportService.importPurchases(validRows, duplicateMode)
        : await reportService.importSalesBills(validRows, duplicateMode);
      setImportResult(data);
      toast.success(
        `${data.inserted} inserted, ${data.skipped} skipped, ${data.replaced} replaced.`,
      );
      onImported?.();
    } catch (err) {
      toast.error(err?.message ?? "Import failed.");
      setStep("review");
    } finally {
      setImporting(false);
    }
  };

  const validCount = result?.validCount ?? 0;
  const showImportResult = step === "importing" && importResult;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            {isPurchase ? "Import Purchases from CSV" : "Import Bills from CSV"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload a CSV with {isPurchase ? "purchase" : "bill"} lines. Totals are recomputed by the
            server and duplicates are checked against existing records.
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {type === "auto" && (
              <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-white p-0.5 w-fit shadow-sm">
                <button
                  type="button"
                  onClick={() => switchSide("sales")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    !isPurchase
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Bills / Sales
                </button>
                <button
                  type="button"
                  onClick={() => switchSide("purchases")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    isPurchase
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Purchases
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                className="h-9 text-xs w-full sm:flex-1"
                onChange={(e) => pickFile(e.target.files)}
              />
              {validating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <Label className="text-xs font-medium text-foreground">Expected columns</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {EXPECTED_COLUMNS.map((c) => (
                  <Badge
                    key={c.key}
                    variant="outline"
                    className="text-[10px] font-normal border-border"
                  >
                    {c.label}
                    {c.required && <span className="text-destructive ml-0.5">*</span>}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Date should be in <span className="font-mono">YYYY-MM-DD</span> format. Recognised
                header aliases (e.g. <span className="font-mono">invoice no</span>,{" "}
                <span className="font-mono">date</span>,{" "}
                {isPurchase ? (
                  <>
                    <span className="font-mono">supplier</span>,{" "}
                    <span className="font-mono">rate</span>,
                  </>
                ) : (
                  <>
                    <span className="font-mono">customer name</span>,
                  </>
                )}{" "}
                <span className="font-mono">qty</span>, <span className="font-mono">gst %</span>)
                are mapped automatically.
              </p>
            </div>
          </div>
        )}

        {step === "review" && result && (
          <div className="flex flex-1 flex-col gap-3 min-h-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-medium border-border">
                {result.totalRows} rows · {fileName}
              </Badge>
              <Badge className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                {validCount} ready
              </Badge>
              {result.errorCount > 0 && (
                <Badge className="text-[10px] font-semibold bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                  {result.errorCount} with errors
                </Badge>
              )}
              {result.duplicates?.length > 0 && (
                <Badge className="text-[10px] font-semibold bg-rose-100 text-rose-700 hover:bg-rose-100 border-0">
                  {result.duplicates.length} duplicate{result.duplicates.length === 1 ? "" : "s"}
                </Badge>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                <Label className="text-[11px] text-muted-foreground">Duplicates</Label>
                <Select value={duplicateMode} onValueChange={setDuplicateMode}>
                  <SelectTrigger className="h-7 w-32 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip" className="text-xs">
                      Skip
                    </SelectItem>
                    <SelectItem value="replace" className="text-xs">
                      Replace
                    </SelectItem>
                    <SelectItem value="cancel" className="text-xs">
                      Cancel on conflict
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border border-border min-h-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wide w-12">#</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide">Bill</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide">Date</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide">
                      {isPurchase ? "Supplier" : "Customer"}
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide">
                      {isPurchase ? "Product" : "Medicine"}
                    </TableHead>
                    {isPurchase && (
                      <TableHead className="text-[10px] uppercase tracking-wide">Batch</TableHead>
                    )}
                    <TableHead className="text-right text-[10px] uppercase tracking-wide">
                      Qty
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wide">
                      Price
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wide">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.preview.map((row) => (
                    <TableRow key={row.row}>
                      <TableCell className="text-[11px] text-muted-foreground">{row.row}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                        {row.data.invoiceNo || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {row.data.billDate ? String(row.data.billDate).slice(0, 10) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                        {row.data.customerName || row.data.supplierName || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {row.data.medicineName || "—"}
                      </TableCell>
                      {isPurchase && (
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {row.data.batchNumber || "—"}
                          {row.data.expiryDate ? ` · ${row.data.expiryDate}` : ""}
                        </TableCell>
                      )}
                      <TableCell className="text-right text-xs">{row.data.quantity}</TableCell>
                      <TableCell className="text-right text-xs">{row.data.unitPrice}</TableCell>
                      <TableCell className="text-right">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            OK
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-amber-600"
                            title={row.errors.join("; ")}
                          >
                            <XCircle className="h-3 w-3" />
                            {row.errors.length} error{row.errors.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {result.errorCount > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Rows with errors are skipped and never imported. Hover the error icon on a row for
                  details.
                </p>
              </div>
            )}
            {result.duplicates?.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  {result.duplicates.length} existing or duplicate bill(s) detected. Choose how to
                  handle them before importing.
                </p>
              </div>
            )}
          </div>
        )}

        {showImportResult && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-semibold text-foreground">Import complete</p>
            <p className="text-xs text-muted-foreground">
              {importResult.inserted} inserted · {importResult.replaced} replaced ·{" "}
              {importResult.skipped} skipped
            </p>
          </div>
        )}

        <DialogFooter className="border-t border-border pt-4">
          {step === "select" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={reset}
              >
                Choose another file
              </Button>
              <Button
                type="button"
                size="sm"
                className={cn(
                  "h-9 text-xs font-semibold gap-1.5",
                  validCount === 0 && "opacity-50",
                )}
                disabled={validCount === 0 || importing}
                onClick={handleImport}
              >
                {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Import {validCount} row{validCount === 1 ? "" : "s"}
              </Button>
            </>
          )}
          {showImportResult && (
            <Button
              type="button"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
