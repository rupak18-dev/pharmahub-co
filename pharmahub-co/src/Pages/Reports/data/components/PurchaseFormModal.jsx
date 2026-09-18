import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  ShoppingCart,
  ImageIcon,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { reportService } from "@/lib/reportService";
import { resolveAssetUrl } from "@/lib/api";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
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
import { PURCHASE_DOCUMENT_TYPES } from "./purchaseDocumentTypes";

const GST_RATE_OPTIONS = [0, 5, 12, 18, 28];

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function emptyItem() {
  return {
    medicineName: "",
    quantity: 1,
    freeQuantity: 0,
    unitCost: "",
    mrp: "",
    discountPct: 0,
    gstRate: 0,
    sgstRate: "",
    cgstRate: "",
    hsnCode: "",
    pack: "",
    batchNumber: "",
    expiryDate: "",
    manufacturer: "",
  };
}

function todayInputValue() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function purchaseDateInput(value) {
  if (!value) return todayInputValue();
  const d = new Date(value);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function expiryInput(value) {
  if (!value) return "";
  if (/^\d{1,2}\/\d{2,4}$/.test(String(value).trim())) return String(value).trim();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

function gstOptions(rate) {
  const current = Number(rate) || 0;
  return GST_RATE_OPTIONS.includes(current)
    ? GST_RATE_OPTIONS
    : [...GST_RATE_OPTIONS, current].sort((a, b) => a - b);
}

export function PurchaseFormModal({
  open,
  onOpenChange,
  purchase,
  currency = "₹",
  onSaved,
  uploadedFile = null,
  source = null,
  onViewExisting = null,
  readOnly = false,
  defaultDocumentType = "purchase_invoice",
  initialData = null,
  extraction = null,
}) {
  const isEdit = !!purchase;

  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayInputValue());
  const [supplierName, setSupplierName] = useState("");
  const [partyGstin, setPartyGstin] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierPhoneEdited, setSupplierPhoneEdited] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneCandidates, setPhoneCandidates] = useState([]);
  const [phoneEdited, setPhoneEdited] = useState(false);
  const [phonePickMode, setPhonePickMode] = useState(false);
  const [documentType, setDocumentType] = useState("purchase_invoice");
  const [printedGrandTotal, setPrintedGrandTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState({ open: false, invoiceNo: "" });

  useEffect(() => {
    if (!open) return;
    const data = purchase ?? initialData;
    const candidates = Array.isArray(data?.phoneCandidates) ? data.phoneCandidates : [];
    const customerCandidates = candidates.filter(
      (c) =>
        c.role === "customer" &&
        !candidates.some((s) => s.role === "supplier" && s.normalizedNumber === c.normalizedNumber),
    );
    setPhoneCandidates(candidates);
    setPhoneEdited(false);
    setPhonePickMode(customerCandidates.length >= 2);
    setSupplierPhoneEdited(false);
    if (data) {
      setInvoiceNo(data.invoiceNo ?? "");
      setPurchaseDate(purchaseDateInput(data.purchaseDate));
      setSupplierName(data.supplier ?? data.supplierName ?? "");
      setPartyGstin(data.party?.gstin ?? "");
      setSupplierPhone(data.supplierPhone ?? "");
      setCustomerPhone(data.customerPhone ?? "");
      setDocumentType(data.documentType ?? defaultDocumentType);
      setPrintedGrandTotal(
        data.printedGrandTotal !== null && data.printedGrandTotal !== undefined
          ? String(data.printedGrandTotal)
          : "",
      );
      setNotes(data.notes ?? "");
      setItems(
        (data.items ?? []).length > 0
          ? data.items.map((i) => ({
              medicineName: i.medicineName ?? "",
              quantity: i.quantity ?? 1,
              freeQuantity: i.freeQuantity ?? 0,
              unitCost: i.unitCost ?? "",
              mrp: i.mrp ?? "",
              discountPct: i.discountPct ?? 0,
              gstRate: i.gstRate ?? 0,
              sgstRate: i.sgstRate ? String(i.sgstRate) : "",
              cgstRate: i.cgstRate ? String(i.cgstRate) : "",
              hsnCode: i.hsnCode ?? "",
              pack: i.pack ?? "",
              batchNumber: i.batchNumber ?? "",
              expiryDate: expiryInput(i.expiryDate),
              manufacturer: i.manufacturer ?? "",
            }))
          : [emptyItem()],
      );
    } else {
      setInvoiceNo("");
      setPurchaseDate(todayInputValue());
      setSupplierName("");
      setPartyGstin("");
      setSupplierPhone("");
      setCustomerPhone("");
      setDocumentType(defaultDocumentType);
      setPrintedGrandTotal("");
      setNotes("");
      setItems([emptyItem()]);
    }
  }, [open, purchase, initialData, defaultDocumentType]);

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const applyGstSplit = (idx, rate) => {
    const half = Number(rate) / 2;
    updateItem(idx, {
      gstRate: Number(rate),
      sgstRate: half ? String(half) : "",
      cgstRate: half ? String(half) : "",
    });
  };

  const lineTotals = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.unitCost) || 0;
    const mrp = Number(it.mrp) || 0;
    const discPct = Math.min(100, Math.max(0, Number(it.discountPct) || 0));
    const sgstInput = Number(it.sgstRate) || 0;
    const cgstInput = Number(it.cgstRate) || 0;
    const combined = Math.min(100, Math.max(0, Number(it.gstRate) || 0));
    const explicitSplit = sgstInput > 0 || cgstInput > 0;
    const sgstRate = explicitSplit ? sgstInput : combined / 2;
    const cgstRate = explicitSplit ? cgstInput : combined / 2;
    const gross = qty * rate;
    const discount = (gross * discPct) / 100;
    const taxable = gross - discount;
    const sgst = (taxable * sgstRate) / 100;
    const cgst = (taxable * cgstRate) / 100;
    return {
      gross,
      discount,
      taxable,
      sgst,
      cgst,
      gst: sgst + cgst,
      total: round2(taxable + sgst + cgst),
      mrp,
    };
  });

  const totals = lineTotals.reduce(
    (acc, lt) => {
      acc.subtotal += lt.gross;
      acc.discount += lt.discount;
      acc.taxable += lt.taxable;
      acc.sgst += lt.sgst;
      acc.cgst += lt.cgst;
      return acc;
    },
    { subtotal: 0, discount: 0, taxable: 0, sgst: 0, cgst: 0 },
  );
  const calculatedGrandTotal = round2(totals.taxable + totals.sgst + totals.cgst);
  const roundOff = round2(Math.round(calculatedGrandTotal) - calculatedGrandTotal);
  const printed = Number(printedGrandTotal);
  const hasPrinted = printedGrandTotal !== "" && Number.isFinite(printed) && printed >= 0;
  const mismatch = hasPrinted && Math.abs(printed - calculatedGrandTotal) > 0.004;

  const isExtracted = extraction?.status === "extracted" && !isEdit;
  const supplierCandidates = phoneCandidates.filter((c) => c.role === "supplier");
  const customerCandidates = phoneCandidates.filter(
    (c) =>
      c.role === "customer" &&
      !supplierCandidates.some((s) => s.normalizedNumber === c.normalizedNumber),
  );
  const isOcrCustomerPhone = customerCandidates.some((c) => c.normalizedNumber === customerPhone);
  const isOcrSupplierPhone = supplierCandidates.some((c) => c.normalizedNumber === supplierPhone);
  const showCandidateSelect = phonePickMode && customerCandidates.length >= 2 && !readOnly;
  const showDetectedCustomer = isExtracted && isOcrCustomerPhone && !phoneEdited;
  const showDetectedSupplier = isExtracted && isOcrSupplierPhone && !supplierPhoneEdited;
  const showNoPhoneNote = isExtracted && !phoneEdited && customerCandidates.length === 0;

  const pickCustomerCandidate = (value) => {
    if (value === "__manual__") {
      setPhonePickMode(false);
      setCustomerPhone("");
      setPhoneEdited(true);
      return;
    }
    setPhonePickMode(false);
    setCustomerPhone(value);
    setPhoneEdited(false);
  };

  const handleSubmit = async () => {
    if (!invoiceNo.trim()) {
      toast.error("Invoice number is required.");
      return;
    }
    if (!purchaseDate) {
      toast.error("Purchase date is required.");
      return;
    }
    if (items.length === 0 || !items.some((i) => i.medicineName.trim())) {
      toast.error("Add at least one item with a product name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        invoiceNo: invoiceNo.trim(),
        purchaseDate: purchaseDate ? new Date(`${purchaseDate}T00:00:00`).toISOString() : undefined,
        supplierName,
        supplierPhone,
        party: { name: supplierName, gstin: partyGstin },
        customerPhone,
        documentType,
        source: source ?? undefined,
        uploadedFile: uploadedFile ?? undefined,
        extraction: extraction ?? undefined,
        printedGrandTotal: hasPrinted ? printed : undefined,
        notes,
        items: items
          .filter((i) => i.medicineName.trim())
          .map((i) => ({
            medicineName: i.medicineName.trim(),
            quantity: Number(i.quantity) || 0,
            freeQuantity: Number(i.freeQuantity) || 0,
            unitCost: Number(i.unitCost) || 0,
            mrp: Number(i.mrp) || 0,
            discountPct: Number(i.discountPct) || 0,
            gstRate: Number(i.gstRate) || 0,
            sgstRate: Number(i.sgstRate) || 0,
            cgstRate: Number(i.cgstRate) || 0,
            hsnCode: i.hsnCode.trim(),
            pack: i.pack.trim(),
            batchNumber: i.batchNumber.trim(),
            expiryDate: i.expiryDate.trim(),
            manufacturer: i.manufacturer.trim(),
          })),
      };
      if (isEdit) {
        await reportService.updateReportBill(purchase.id, payload);
        toast.success(`Purchase ${payload.invoiceNo} updated.`);
      } else {
        await reportService.createReportBill(payload);
        toast.success(`Purchase ${payload.invoiceNo} saved.`);
      }
      onSaved?.();
    } catch (err) {
      if (err?.status === 409) {
        setDuplicate({ open: true, invoiceNo: invoiceNo.trim() });
      } else {
        toast.error(err?.message ?? "Failed to save purchase.");
      }
    } finally {
      setSaving(false);
    }
  };

  const viewExisting = () => {
    const target = duplicate.invoiceNo;
    setDuplicate({ open: false, invoiceNo: "" });
    if (onViewExisting) {
      onViewExisting(target);
    } else {
      onOpenChange(false);
      toast.error(`A purchase numbered ${target} already exists for this date.`);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              {readOnly
                ? `Purchase ${purchase?.invoiceNo ?? ""}`
                : isEdit
                  ? `Edit Purchase ${purchase.invoiceNo}`
                  : "New Purchase"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Totals are recomputed by the server. This purchase appears in Purchases, Suppliers and
              GST reports.
            </DialogDescription>
          </DialogHeader>

          {uploadedFile?.path && (
            <div className="rounded-lg border border-border bg-muted/30 p-2">
              <img
                src={resolveAssetUrl(uploadedFile.path)}
                alt="Purchase document"
                className="max-h-40 w-auto rounded-md border border-border object-contain"
              />
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                Original document attached to this record.
              </p>
            </div>
          )}

          {extraction?.status === "extracted" && !isEdit && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-[11px] text-green-800">
              Fields below were prefilled from the uploaded document using OCR. Review them and fix
              anything wrong before saving — totals are always recomputed by the server.
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Header fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Invoice Number *</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. SRJ001107"
                  value={invoiceNo}
                  disabled={readOnly}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Purchase Date *</Label>
                <DatePicker
                  className="w-full"
                  style={{ fontSize: 12 }}
                  format="DD MMM YYYY"
                  allowClear
                  value={purchaseDate ? dayjs(purchaseDate, "YYYY-MM-DD") : null}
                  disabled={readOnly}
                  onChange={(d) => setPurchaseDate(d ? d.format("YYYY-MM-DD") : "")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Supplier</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. SRI SAI VENKATA DURGA ENTERPRISES"
                  value={supplierName}
                  disabled={readOnly}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Supplier GSTIN</Label>
                <Input
                  className="h-9 text-sm font-mono uppercase"
                  placeholder="e.g. 37AABCS1429B1Z5"
                  value={partyGstin}
                  disabled={readOnly}
                  onChange={(e) => setPartyGstin(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  Supplier Phone
                  {showDetectedSupplier && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Detected from uploaded document
                    </span>
                  )}
                </Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. 92920 00166"
                  value={supplierPhone}
                  disabled={readOnly}
                  onChange={(e) => {
                    setSupplierPhoneEdited(true);
                    setSupplierPhone(e.target.value);
                  }}
                />
                <p className="text-[10px] text-muted-foreground">
                  The supplier's contact number, used in the Suppliers report.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  Customer / WhatsApp Number
                  {showDetectedCustomer && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Detected from uploaded document
                    </span>
                  )}
                </Label>
                {showCandidateSelect ? (
                  <Select
                    value={customerPhone || "__manual__"}
                    onValueChange={pickCustomerCandidate}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Choose the customer's number" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerCandidates.map((c) => (
                        <SelectItem
                          key={c.normalizedNumber}
                          value={c.normalizedNumber}
                          className="text-xs"
                        >
                          {c.normalizedNumber}
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            ({c.context})
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="__manual__" className="text-xs">
                        Enter manually…
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-9 text-sm"
                    placeholder="e.g. 98765 43210"
                    value={customerPhone}
                    disabled={readOnly}
                    onChange={(e) => {
                      setPhoneEdited(true);
                      setCustomerPhone(e.target.value);
                    }}
                  />
                )}
                {showNoPhoneNote && (
                  <p className="text-[10px] text-amber-600">
                    No customer WhatsApp number was detected from this document.
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Used to deliver the bill on WhatsApp when this pharmacy later records a sale to
                  this customer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_DOCUMENT_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value} className="text-xs capitalize">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Printed Grand Total (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  className="h-9 text-sm font-mono"
                  placeholder="Amount printed on the invoice"
                  value={printedGrandTotal}
                  disabled={readOnly}
                  onChange={(e) => setPrintedGrandTotal(e.target.value)}
                />
              </div>
            </div>

            {mismatch && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Printed total differs from the calculated total.</p>
                  <p>
                    Printed {currency}
                    {money(printed)} vs calculated {currency}
                    {money(calculatedGrandTotal)}. Reports use the printed total when it is set —
                    use it only if the invoice actually rounds the amount.
                  </p>
                  {!readOnly && (
                    <button
                      type="button"
                      className="font-semibold underline underline-offset-2 hover:text-amber-800"
                      onClick={() => setPrintedGrandTotal(String(calculatedGrandTotal))}
                    >
                      Use calculated total
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Items</Label>
                {!readOnly && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1"
                    onClick={addItem}
                  >
                    <Plus className="h-3 w-3" />
                    Add item
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const lt = lineTotals[idx];
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-border bg-muted/30 p-2 space-y-2"
                    >
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-3">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Product name"
                            value={item.medicineName}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { medicineName: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="Qty"
                            value={item.quantity}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="Free"
                            value={item.freeQuantity}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { freeQuantity: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="Rate"
                            value={item.unitCost}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { unitCost: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="MRP"
                            value={item.mrp}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { mrp: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="Disc %"
                            value={item.discountPct}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { discountPct: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1 text-right">
                          <span className="font-mono text-xs font-semibold">
                            {currency}
                            {money(lt.total)}
                          </span>
                        </div>
                        {!readOnly && (
                          <div className="col-span-12 sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              disabled={items.length === 1}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4 sm:col-span-2">
                          <Select
                            value={String(Number(item.gstRate) || 0)}
                            onValueChange={(v) => applyGstSplit(idx, v)}
                            disabled={readOnly}
                          >
                            <SelectTrigger className="h-8 text-xs px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {gstOptions(item.gstRate).map((r) => (
                                <SelectItem key={r} value={String(r)} className="text-xs">
                                  {r}% GST
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="SGST %"
                            value={item.sgstRate}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { sgstRate: e.target.value })}
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="CGST %"
                            value={item.cgstRate}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { cgstRate: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Batch"
                            value={item.batchNumber}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { batchNumber: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Expiry MM/YY"
                            value={item.expiryDate}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { expiryDate: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <Input
                            className="h-8 text-xs"
                            placeholder="HSN"
                            value={item.hsnCode}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { hsnCode: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Pack"
                            value={item.pack}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { pack: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span>
                          Gross {currency}
                          {money(lt.gross)}
                        </span>
                        <span>
                          Discount {currency}
                          {money(lt.discount)}
                        </span>
                        <span>
                          Taxable {currency}
                          {money(lt.taxable)}
                        </span>
                        <span>
                          SGST +{currency}
                          {money(lt.sgst)}
                        </span>
                        <span>
                          CGST +{currency}
                          {money(lt.cgst)}
                        </span>
                        {lt.mrp > 0 && (
                          <span>
                            MRP {currency}
                            {money(lt.mrp)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes</Label>
              <Textarea
                className="h-16 text-xs"
                placeholder="Optional remarks for this purchase"
                value={notes}
                disabled={readOnly}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Totals preview */}
          <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 border-t border-border pt-3 text-xs">
            <div className="text-muted-foreground">
              Subtotal{" "}
              <span className="font-mono font-semibold text-foreground">
                {money(totals.subtotal)}
              </span>
            </div>
            <div className="text-muted-foreground">
              Discount{" "}
              <span className="font-mono font-semibold text-foreground">
                {money(totals.discount)}
              </span>
            </div>
            <div className="text-muted-foreground">
              Taxable{" "}
              <span className="font-mono font-semibold text-foreground">
                {money(totals.taxable)}
              </span>
            </div>
            <div className="text-muted-foreground">
              SGST{" "}
              <span className="font-mono font-semibold text-foreground">+{money(totals.sgst)}</span>
            </div>
            <div className="text-muted-foreground">
              CGST{" "}
              <span className="font-mono font-semibold text-foreground">+{money(totals.cgst)}</span>
            </div>
            <div className="text-muted-foreground">
              Round Off{" "}
              <span className="font-mono font-semibold text-foreground">{money(roundOff)}</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              Calculated{" "}
              <span className="font-mono">
                {currency}
                {money(calculatedGrandTotal)}
              </span>
            </div>
            <div className="text-sm font-semibold text-primary">
              Grand Total{" "}
              <span className="font-mono">
                {currency}
                {money(hasPrinted ? printed : calculatedGrandTotal)}
              </span>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            {readOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            ) : (
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
                  className="h-9 text-xs font-semibold gap-1.5"
                  disabled={saving}
                  onClick={handleSubmit}
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isEdit ? "Save Changes" : "Save Purchase"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate purchase dialog */}
      <AlertDialog
        open={duplicate.open}
        onOpenChange={(next) => !next && setDuplicate((d) => ({ ...d, open: false }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">This purchase already exists</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              A purchase numbered{" "}
              <span className="font-mono font-semibold">{duplicate.invoiceNo}</span> already exists
              for this date in your pharmacy. View the existing record, or cancel and choose a
              different invoice number.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDuplicate((d) => ({ ...d, open: false }))}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={viewExisting}>View Existing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
