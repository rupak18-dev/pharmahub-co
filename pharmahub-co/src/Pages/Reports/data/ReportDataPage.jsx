import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileUp,
  FileSpreadsheet,
  Filter,
  Plus,
  Pencil,
  Eye,
  Search,
  Trash2,
  X,
  Loader2,
  Receipt,
  ShoppingCart,
  Wallet,
  MessageCircle,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useDb } from "@/hooks/useDb";
import { reportService } from "@/lib/reportService";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
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
} from "@/Components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { BillFormModal } from "./components/BillFormModal";
import { PurchaseFormModal } from "./components/PurchaseFormModal";
import { UploadBillModal } from "./components/UploadBillModal";
import { ImportCsvModal } from "./components/ImportCsvModal";

export const handle = { title: "Report Data · PharmaHub" };

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer", "Credit", "Other"];
const PAYMENT_STATUSES = ["paid", "pending", "partial"];
const SOURCES = [
  { value: "manual", label: "Manual" },
  { value: "uploaded", label: "Uploaded" },
  { value: "imported", label: "Imported" },
  { value: "existing", label: "Existing" },
];
const DOCUMENT_TYPES = [
  { value: "sales", label: "Sales / Bills" },
  { value: "purchases", label: "Purchases" },
  { value: "sales_invoice", label: "Sales Invoice" },
  { value: "purchase_invoice", label: "Purchase Invoice" },
  { value: "payment_receipt", label: "Payment Receipt" },
  { value: "other", label: "Other" },
];
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
];

const SOURCE_BADGE = {
  uploaded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  manual: "bg-sky-50 text-sky-700 border-sky-200",
  imported: "bg-violet-50 text-violet-700 border-violet-200",
  existing: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatMoney(value, currency) {
  return `${currency}${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy");
}

const PAYMENT_STATUS_DOT = {
  paid: "bg-emerald-500",
  pending: "bg-amber-500",
  partial: "bg-blue-500",
};

// Compact grouped payment chip: "● UPI · Paid" — mode and status shown as one
// visual unit instead of two disconnected lines.
function PaymentChip({ bill }) {
  const mode = bill.paymentMode || "—";
  const status = bill.paymentStatus ?? "paid";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          PAYMENT_STATUS_DOT[status] ?? "bg-muted-foreground/50",
        )}
        aria-hidden="true"
      />
      <span className="text-[11px] font-medium text-foreground">{mode}</span>
      {status && <span className="text-[10px] capitalize text-muted-foreground">· {status}</span>}
    </span>
  );
}

function prettyType(documentType) {
  if (!documentType) return "Document";
  return String(documentType)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// WhatsApp delivery state badge. Only ReportBill sales records have delivery
// state; everything else (Sale/Purchase) renders a plain dash.
function WhatsAppStatusBadge({ bill }) {
  if (!(bill?.kind === "bill" && bill?.documentType === "sales_invoice")) {
    return <span className="text-[10px] text-muted-foreground">—</span>;
  }
  const status = bill.whatsapp?.status ?? "not_attempted";
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
        <Check className="h-3 w-3" /> Sent
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
        title={bill.whatsapp?.errorMessage ?? "WhatsApp delivery failed"}
      >
        <AlertTriangle className="h-3 w-3" /> Failed
      </span>
    );
  }
  if (status === "skipped") {
    const reason = bill.whatsapp?.reason;
    const title =
      reason === "not_connected"
        ? "WhatsApp Business is not connected — delivery skipped"
        : reason === "server_not_configured"
          ? "WhatsApp Business is connected, but the server's WhatsApp credentials are not configured — delivery skipped"
          : reason === "no_number"
            ? "No customer WhatsApp number — delivery skipped"
            : reason === "invalid_number"
              ? "Invalid customer WhatsApp number — delivery skipped"
              : "WhatsApp delivery skipped";
    return (
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
        title={title}
      >
        <MessageCircle className="h-3 w-3" /> Skipped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
      Not sent
    </span>
  );
}

export default function ReportDataPage() {
  const dbData = useDb((d) => d);
  const currency = dbData.settings?.currency ?? "₹";
  const navigate = useNavigate();

  const [bills, setBills] = useState({ items: [], meta: {} });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, uploaded: 0, manual: 0, totalValue: 0 });

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [source, setSource] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [viewingBill, setViewingBill] = useState(null);
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTypeChooserOpen, setIsTypeChooserOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState(null);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getReportBills({
        search,
        dateFrom,
        dateTo,
        source,
        documentType,
        paymentMode,
        paymentStatus,
        sort,
        page,
        limit: 20,
      });
      setBills(data);
    } catch {
      toast.error("Failed to load bills.");
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, source, documentType, paymentMode, paymentStatus, sort, page]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await reportService.getReportBillsSummary());
    } catch {
      setSummary({ total: 0, uploaded: 0, manual: 0, totalValue: 0 });
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const isSalesRecord = (record) =>
    record?.kind === "sale" ||
    (record?.kind === "bill" && record?.documentType === "sales_invoice");

  const openNewSales = () => {
    setIsTypeChooserOpen(false);
    setViewingBill(null);
    setEditingBill(null);
    setIsFormOpen(true);
  };

  const openNewPurchase = () => {
    setIsTypeChooserOpen(false);
    setViewingPurchase(null);
    setEditingPurchase(null);
    setIsPurchaseFormOpen(true);
  };

  const openRecord = (record, view) => {
    if (isSalesRecord(record)) {
      setViewingPurchase(null);
      setEditingPurchase(null);
      setViewingBill(view ? record : null);
      setEditingBill(view ? null : record);
      setIsFormOpen(true);
    } else {
      setViewingBill(null);
      setEditingBill(null);
      setViewingPurchase(view ? record : null);
      setEditingPurchase(view ? null : record);
      setIsPurchaseFormOpen(true);
    }
  };

  const handleSaved = async () => {
    setIsFormOpen(false);
    setEditingBill(null);
    setViewingBill(null);
    setIsPurchaseFormOpen(false);
    setEditingPurchase(null);
    setViewingPurchase(null);
    setIsUploadOpen(false);
    await Promise.all([loadBills(), loadSummary()]);
  };

  const handleSendWhatsApp = async (bill) => {
    if (sendingWhatsAppId) return;
    setSendingWhatsAppId(bill.id);
    try {
      const isRetry = bill.whatsapp?.status === "failed";
      const data = isRetry
        ? await reportService.retryReportBillWhatsApp(bill.id)
        : await reportService.sendReportBillWhatsApp(bill.id);
      const w = data?.whatsapp;
      if (w?.status === "sent") {
        toast.success(`Bill ${bill.invoiceNo} sent on WhatsApp.`);
      } else if (w?.status === "failed") {
        toast.error("WhatsApp delivery failed — the bill is still saved.");
      } else if (w?.reason === "not_connected") {
        toast.info("WhatsApp Business is not connected — bill saved, delivery skipped.");
      } else if (w?.reason === "server_not_configured") {
        toast.info(
          "WhatsApp Business is connected, but the server's WhatsApp credentials are not configured — delivery skipped.",
        );
      } else if (w?.reason === "no_number") {
        toast.info("This bill has no customer phone number to deliver to.");
      } else if (w?.reason === "invalid_number") {
        toast.info("The customer phone number is not a valid Indian mobile number.");
      } else {
        toast.info("WhatsApp delivery skipped.");
      }
      await loadBills();
    } catch (err) {
      toast.error(err?.message ?? "Failed to send on WhatsApp.");
    } finally {
      setSendingWhatsAppId(null);
    }
  };

  const viewExistingByNumber = async (invoiceNo) => {
    try {
      const data = await reportService.getReportBills({ search: invoiceNo, limit: 20 });
      const found = (data.items ?? []).find(
        (r) => String(r.invoiceNo).toLowerCase() === String(invoiceNo).toLowerCase(),
      );
      if (found) {
        openRecord(found, false);
      } else {
        toast.error(`Could not find a record numbered ${invoiceNo}.`);
      }
    } catch {
      toast.error("Could not load the existing record.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSource("");
    setDocumentType("");
    setPaymentMode("");
    setPaymentStatus("");
    setSort("newest");
    setPage(1);
  };

  const hasFilters = Boolean(
    search || dateFrom || dateTo || source || documentType || paymentMode || paymentStatus,
  );

  const dateRangeValue =
    dateFrom || dateTo
      ? [
          dateFrom ? dayjs(dateFrom, "YYYY-MM-DD") : null,
          dateTo ? dayjs(dateTo, "YYYY-MM-DD") : null,
        ]
      : null;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reportService.deleteReportBill(deleteTarget.id);
      toast.success(`Bill ${deleteTarget.invoiceNo} deleted.`);
      await Promise.all([loadBills(), loadSummary()]);
    } catch (err) {
      toast.error(err?.message ?? "Failed to delete bill.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const totalCount = bills.meta?.total ?? 0;
  const totalPages = Math.max(1, bills.meta?.pages ?? 1);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const kpiCards = useMemo(
    () => [
      {
        label: "Total Bills",
        value: (summary.total ?? 0).toLocaleString("en-IN"),
        icon: Receipt,
        cls: "bg-emerald-50 text-emerald-600",
        iconCls: "text-emerald-600",
      },
      {
        label: "Total Value",
        value: formatMoney(summary.totalValue, currency),
        icon: Wallet,
        cls: "bg-violet-50 text-violet-600",
        iconCls: "text-violet-600",
      },
      {
        label: "Uploaded",
        value: (summary.uploaded ?? 0).toLocaleString("en-IN"),
        icon: FileUp,
        cls: "bg-sky-50 text-sky-600",
        iconCls: "text-sky-600",
      },
      {
        label: "Manual",
        value: (summary.manual ?? 0).toLocaleString("en-IN"),
        icon: Pencil,
        cls: "bg-amber-50 text-amber-600",
        iconCls: "text-amber-600",
      },
    ],
    [summary, currency],
  );

  return (
    <div className="space-y-6 pb-12 bg-white min-h-screen p-6 rounded-2xl shadow-sm border border-border/40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Reports
        </button>
        <span className="text-foreground font-medium">Report Data</span>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Report Data"
        description="Add, upload or import bills and report records that feed your Reports."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-medium gap-1.5"
              onClick={() => setIsImportOpen(true)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
              Import CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-medium gap-1.5"
              onClick={() => setIsUploadOpen(true)}
            >
              <FileUp className="h-3.5 w-3.5 text-muted-foreground" />
              Upload Document
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5"
              onClick={() => setIsTypeChooserOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Bill
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-border/80 rounded-xl p-2.5 shadow-sm flex items-center gap-3"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                kpi.cls,
              )}
            >
              <kpi.icon className={cn("w-4 h-4", kpi.iconCls)} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">
                {kpi.label}
              </span>
              <span className="text-base font-bold text-slate-800 block truncate">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters panel */}
      <div className="bg-muted/20 border border-border/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Report Data Filters
          </div>
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Reset All
          </button>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white"
            placeholder="Search bill/invoice no, party, medicine, batch…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2 p-0.5 rounded text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <Select
            value={documentType}
            onValueChange={(v) => {
              setDocumentType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" className="text-xs">
                All types
              </SelectItem>
              {DOCUMENT_TYPES.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-xs">
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={source}
            onValueChange={(v) => {
              setSource(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" className="text-xs">
                All sources
              </SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={paymentMode}
            onValueChange={(v) => {
              setPaymentMode(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="All payment modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" className="text-xs">
                All payment modes
              </SelectItem>
              {PAYMENT_MODES.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={paymentStatus}
            onValueChange={(v) => {
              setPaymentStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" className="text-xs">
                Any status
              </SelectItem>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePicker.RangePicker
            value={dateRangeValue}
            onChange={(dates) => {
              setDateFrom(dates?.[0] ? dates[0].format("YYYY-MM-DD") : "");
              setDateTo(dates?.[1] ? dates[1].format("YYYY-MM-DD") : "");
              setPage(1);
            }}
            format="DD MMM YYYY"
            separator="–"
            placeholder={["From date", "To date"]}
            allowClear
            style={{ width: "100%", fontSize: 12 }}
          />
        </div>
      </div>

      {/* Unified bills table */}
      <div className="rounded-xl border border-border/80 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">All Bills</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {totalCount.toLocaleString("en-IN")} record{totalCount === 1 ? "" : "s"}
            </Badge>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>

        {bills.items.length === 0 && !loading ? (
          <div className="p-6">
            <EmptyState
              icon={Receipt}
              title="No bills found"
              description={
                hasFilters
                  ? "No records match the current filters. Try clearing or changing them."
                  : "Add a bill manually, upload a document, or import a CSV to start feeding your reports."
              }
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {hasFilters ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={resetFilters}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setIsUploadOpen(true)}
                      >
                        <FileUp className="h-3.5 w-3.5" />
                        Upload Document
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setIsTypeChooserOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New Bill
                      </Button>
                    </>
                  )}
                </div>
              }
            />
          </div>
        ) : (
          <Table className="min-w-[1250px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 min-w-[105px] text-[11px] uppercase tracking-wide">
                  Bill
                </TableHead>
                <TableHead className="h-9 min-w-[95px] text-[11px] uppercase tracking-wide">
                  Date
                </TableHead>
                <TableHead className="h-9 min-w-[190px] text-[11px] uppercase tracking-wide">
                  Party
                </TableHead>
                <TableHead className="h-9 min-w-[210px] text-[11px] uppercase tracking-wide">
                  Items
                </TableHead>
                <TableHead className="h-9 min-w-[110px] text-[11px] uppercase tracking-wide">
                  Type
                </TableHead>
                <TableHead className="h-9 min-w-[110px] text-[11px] uppercase tracking-wide">
                  Payment
                </TableHead>
                <TableHead className="h-9 min-w-[100px] text-[11px] uppercase tracking-wide">
                  WhatsApp
                </TableHead>
                <TableHead className="h-9 min-w-[85px] text-right text-[11px] uppercase tracking-wide">
                  GST
                </TableHead>
                <TableHead className="h-9 min-w-[110px] text-right text-[11px] uppercase tracking-wide">
                  Total
                </TableHead>
                <TableHead className="h-9 min-w-[100px] text-[11px] uppercase tracking-wide">
                  Source
                </TableHead>
                <TableHead className="h-9 min-w-[140px] text-right text-[11px] uppercase tracking-wide">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.items.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="py-1.5 min-w-[105px] font-semibold text-foreground whitespace-nowrap">
                    {bill.invoiceNo || "—"}
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[95px] whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(bill.billDate ?? bill.purchaseDate ?? bill.invoiceDate)}
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[190px]">
                    <p
                      title={bill.customerName || bill.supplierName || "Walk-in Customer"}
                      className="max-w-[300px] truncate text-xs font-medium text-foreground"
                    >
                      {bill.customerName || bill.supplierName || "Walk-in Customer"}
                    </p>
                    {(bill.customerPhone || bill.supplierGstin || bill.customerGstin) && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                        {bill.customerPhone || bill.supplierGstin || bill.customerGstin}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[210px] whitespace-nowrap text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {bill.itemCount} item{bill.itemCount === 1 ? "" : "s"}
                    </span>
                    {bill.itemNames?.[0] ? (
                      <>
                        <span className="mx-1 text-muted-foreground/50">·</span>
                        <span
                          title={bill.itemNames[0]}
                          className="inline-block max-w-[220px] truncate align-bottom"
                        >
                          {bill.itemNames[0]}
                        </span>
                      </>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[110px]">
                    <span
                      className="inline-flex items-center whitespace-nowrap rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      title={prettyType(bill.documentType)}
                    >
                      {prettyType(bill.documentType)}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[110px]">
                    <PaymentChip bill={bill} />
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[100px]">
                    <WhatsAppStatusBadge bill={bill} />
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[85px] text-right whitespace-nowrap">
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      {formatMoney(bill.gstTotal, currency)}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[110px] text-right font-semibold text-foreground whitespace-nowrap">
                    <span className="tabular-nums">{formatMoney(bill.grandTotal, currency)}</span>
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[100px]">
                    <span
                      className={cn(
                        "inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize",
                        SOURCE_BADGE[bill.source] ?? SOURCE_BADGE.existing,
                      )}
                      title={bill.source}
                    >
                      {bill.source}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 min-w-[140px] text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {bill?.kind === "bill" && bill?.documentType === "sales_invoice" && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(bill)}
                          disabled={sendingWhatsAppId === bill.id}
                          className="p-1 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                          aria-label={
                            bill.whatsapp?.status === "failed"
                              ? `Retry WhatsApp delivery for bill ${bill.invoiceNo}`
                              : `Send bill ${bill.invoiceNo} on WhatsApp`
                          }
                          title={
                            bill.whatsapp?.status === "failed"
                              ? "Retry WhatsApp delivery"
                              : "Send on WhatsApp"
                          }
                        >
                          {sendingWhatsAppId === bill.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openRecord(bill, true)}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label={`View bill ${bill.invoiceNo}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openRecord(bill, false)}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label={`Edit bill ${bill.invoiceNo}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(bill)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Delete bill ${bill.invoiceNo}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {bills.items.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {totalCount.toLocaleString("en-IN")} records
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                disabled={!hasNext}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New record type chooser */}
      <Dialog open={isTypeChooserOpen} onOpenChange={setIsTypeChooserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add a new record</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sales-type records feed Sales, GST and Payments reports. Purchase-type records feed
              Purchases, Suppliers and GST reports.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={openNewSales}
              className="group rounded-xl border border-border/80 bg-white p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-3">
                <Receipt className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">Sales / Customer Bill</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Add a customer invoice or bill manually.
              </p>
            </button>
            <button
              type="button"
              onClick={openNewPurchase}
              className="group rounded-xl border border-border/80 bg-white p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 mb-3">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">Purchase / Supplier Document</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Add a purchase invoice, receipt or other supplier document manually.
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <BillFormModal
        open={isFormOpen}
        onOpenChange={(next) => {
          if (!next) {
            setViewingBill(null);
            setEditingBill(null);
            setIsFormOpen(false);
          }
        }}
        bill={viewingBill ?? editingBill}
        currency={currency}
        readOnly={!!viewingBill}
        uploadedFile={viewingBill?.uploadedFile ?? editingBill?.uploadedFile ?? null}
        onViewExisting={viewExistingByNumber}
        onSaved={handleSaved}
      />
      <PurchaseFormModal
        open={isPurchaseFormOpen}
        onOpenChange={(next) => {
          if (!next) {
            setViewingPurchase(null);
            setEditingPurchase(null);
            setIsPurchaseFormOpen(false);
          }
        }}
        purchase={viewingPurchase ?? editingPurchase}
        currency={currency}
        readOnly={!!viewingPurchase}
        uploadedFile={viewingPurchase?.uploadedFile ?? editingPurchase?.uploadedFile ?? null}
        onViewExisting={viewExistingByNumber}
        onSaved={handleSaved}
      />
      <UploadBillModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        currency={currency}
        type="auto"
        onSaved={handleSaved}
      />
      <ImportCsvModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImported={async () => {
          await Promise.all([loadBills(), loadSummary()]);
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bill {deleteTarget?.invoiceNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This record and its totals will be removed from Sales, Purchases, Suppliers, GST and
              Payments reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
