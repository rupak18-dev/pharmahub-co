import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Receipt,
  ImageIcon,
  MessageCircle,
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

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer", "Credit", "Other"];
const PAYMENT_STATUSES = ["paid", "pending", "partial"];
const GST_RATE_OPTIONS = [0, 5, 12, 18, 28];

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function emptyItem() {
  return { medicineName: "", quantity: 1, unitPrice: "", discountPct: 0, gstRate: 0 };
}

function todayInputValue() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function billDateInput(billDate) {
  if (!billDate) return todayInputValue();
  const d = new Date(billDate);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function gstOptions(rate) {
  const current = Number(rate) || 0;
  return GST_RATE_OPTIONS.includes(current)
    ? GST_RATE_OPTIONS
    : [...GST_RATE_OPTIONS, current].sort((a, b) => a - b);
}

export function BillFormModal({
  open,
  onOpenChange,
  bill,
  currency = "₹",
  onSaved,
  uploadedFile = null,
  source = null,
  onViewExisting = null,
  readOnly = false,
  initialData = null,
  extraction = null,
}) {
  const isEdit = !!bill;

  const [invoiceNo, setInvoiceNo] = useState("");
  const [billDate, setBillDate] = useState(todayInputValue());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneCandidates, setPhoneCandidates] = useState([]);
  const [phoneEdited, setPhoneEdited] = useState(false);
  const [phonePickMode, setPhonePickMode] = useState(false);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [duplicate, setDuplicate] = useState({ open: false, invoiceNo: "" });

  useEffect(() => {
    if (!open) return;
    const data = bill ?? initialData;
    const candidates = Array.isArray(data?.phoneCandidates) ? data.phoneCandidates : [];
    const customerCandidates = candidates.filter(
      (c) =>
        c.role === "customer" &&
        !candidates.some((s) => s.role === "supplier" && s.normalizedNumber === c.normalizedNumber),
    );
    setPhoneCandidates(candidates);
    setPhoneEdited(false);
    setPhonePickMode(customerCandidates.length >= 2);
    if (data) {
      setInvoiceNo(data.invoiceNo ?? "");
      setBillDate(billDateInput(data.billDate));
      setCustomerName(data.customerName ?? "");
      setCustomerPhone(data.customerPhone ?? "");
      setPaymentMode(data.paymentMode ?? "Cash");
      setPaymentStatus(data.paymentStatus ?? "paid");
      setNotes(data.notes ?? "");
      setItems(
        (data.items ?? []).length > 0
          ? data.items.map((i) => ({
              medicineName: i.medicineName ?? "",
              quantity: i.quantity ?? 1,
              unitPrice: i.unitPrice ?? "",
              discountPct: i.discountPct ?? 0,
              gstRate: i.gstRate ?? 0,
            }))
          : [emptyItem()],
      );
    } else {
      setInvoiceNo("");
      setBillDate(todayInputValue());
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMode("Cash");
      setPaymentStatus("paid");
      setNotes("");
      setItems([emptyItem()]);
    }
  }, [open, bill, initialData]);

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const lineTotals = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const discPct = Math.min(100, Math.max(0, Number(it.discountPct) || 0));
    const gstRate = Math.min(100, Math.max(0, Number(it.gstRate) || 0));
    const gross = qty * price;
    const discount = (gross * discPct) / 100;
    const taxable = gross - discount;
    const gst = (taxable * gstRate) / 100;
    return { gross, discount, taxable, gst, total: round2(taxable + gst) };
  });

  const totals = lineTotals.reduce(
    (acc, lt) => {
      acc.subtotal += lt.gross;
      acc.discount += lt.discount;
      acc.taxable += lt.taxable;
      acc.gst += lt.gst;
      return acc;
    },
    { subtotal: 0, discount: 0, taxable: 0, gst: 0 },
  );
  const rawGrand = totals.subtotal - totals.discount + totals.gst;
  const grandTotal = round2(rawGrand);
  const roundOff = round2(Math.round(rawGrand) - rawGrand);

  const isExtracted = extraction?.status === "extracted" && !isEdit;
  const customerCandidates = phoneCandidates.filter(
    (c) =>
      c.role === "customer" &&
      !phoneCandidates.some(
        (s) => s.role === "supplier" && s.normalizedNumber === c.normalizedNumber,
      ),
  );
  const isOcrPhone = customerCandidates.some((c) => c.normalizedNumber === customerPhone);
  const showCandidateSelect = phonePickMode && customerCandidates.length >= 2 && !readOnly;
  const showDetected = isExtracted && isOcrPhone && !phoneEdited;
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

  const validate = () => {
    if (!invoiceNo.trim()) {
      toast.error("Bill Number is required.");
      return false;
    }
    if (!billDate) {
      toast.error("Bill Date is required.");
      return false;
    }
    const emptyItemIdx = items.findIndex((it) => !String(it.medicineName ?? "").trim());
    if (emptyItemIdx !== -1) {
      toast.error(`Item ${emptyItemIdx + 1}: Medicine / item name is required.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        invoiceNo: invoiceNo.trim(),
        billDate: billDate ? new Date(`${billDate}T00:00:00`).toISOString() : undefined,
        documentType: "sales_invoice",
        customerName,
        customerPhone,
        paymentMode,
        paymentStatus,
        notes,
        source: source ?? undefined,
        uploadedFile: uploadedFile ?? undefined,
        extraction: extraction ?? undefined,
        items: items
          .filter((i) => i.medicineName.trim())
          .map((i) => ({
            medicineName: i.medicineName.trim(),
            quantity: Number(i.quantity) || 0,
            unitPrice: Number(i.unitPrice) || 0,
            discountPct: Number(i.discountPct) || 0,
            gstRate: Number(i.gstRate) || 0,
          })),
      };
      if (isEdit) {
        await reportService.updateReportBill(bill.id, payload);
        toast.success(`Bill ${payload.invoiceNo} updated.`);
      } else {
        const created = await reportService.createReportBill(payload);
        const w = created?.whatsapp;
        if (w?.status === "sent") {
          toast.success(`Bill ${payload.invoiceNo} saved and sent on WhatsApp.`);
        } else if (w?.status === "failed") {
          toast.success(`Bill ${payload.invoiceNo} saved, but WhatsApp delivery failed.`);
        } else if (w?.reason === "not_connected") {
          toast.success(
            `Bill ${payload.invoiceNo} saved. WhatsApp delivery skipped — WhatsApp Business is not connected.`,
          );
        } else if (w?.reason === "server_not_configured") {
          toast.success(
            `Bill ${payload.invoiceNo} saved. WhatsApp Business is connected, but the server's WhatsApp credentials are not configured — delivery skipped.`,
          );
        } else if (w?.reason === "no_number") {
          toast.success(
            `Bill ${payload.invoiceNo} saved. Add a customer phone number to deliver it on WhatsApp.`,
          );
        } else if (w?.reason === "invalid_number") {
          toast.success(
            `Bill ${payload.invoiceNo} saved. The customer phone number is not a valid Indian mobile number.`,
          );
        } else {
          toast.success(`Bill ${payload.invoiceNo} saved.`);
        }
      }
      onSaved?.();
    } catch (err) {
      if (err?.status === 409) {
        setDuplicate({ open: true, invoiceNo: invoiceNo.trim() });
      } else {
        toast.error(err?.message ?? "Failed to save bill.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!bill) return;
    setSendingWhatsApp(true);
    try {
      const data = await reportService.sendReportBillWhatsApp(bill.id);
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
      onSaved?.();
    } catch (err) {
      toast.error(err?.message ?? "Failed to send on WhatsApp.");
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const viewExisting = () => {
    const target = duplicate.invoiceNo;
    setDuplicate({ open: false, invoiceNo: "" });
    if (onViewExisting) {
      onViewExisting(target);
    } else {
      onOpenChange(false);
      toast.error(`A bill numbered ${target} already exists for this date.`);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              {readOnly
                ? `Bill ${bill?.invoiceNo ?? ""}`
                : isEdit
                  ? `Edit Bill ${bill.invoiceNo}`
                  : "New Bill"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Totals are recomputed and stored by the server. This bill will appear in Sales, GST
              and Payments reports.
            </DialogDescription>
          </DialogHeader>

          {uploadedFile?.path && (
            <div className="rounded-lg border border-border bg-muted/30 p-2">
              <img
                src={resolveAssetUrl(uploadedFile.path)}
                alt="Bill upload"
                className="max-h-40 w-auto rounded-md border border-border object-contain"
              />
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                Original bill image attached to this record.
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
            {/* Bill header fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Bill Number *</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. MAN-0001"
                  value={invoiceNo}
                  disabled={readOnly}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Bill Date *</Label>
                <DatePicker
                  className="w-full"
                  style={{ fontSize: 12 }}
                  format="DD MMM YYYY"
                  allowClear
                  value={billDate ? dayjs(billDate, "YYYY-MM-DD") : null}
                  disabled={readOnly}
                  onChange={(d) => setBillDate(d ? d.format("YYYY-MM-DD") : "")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Customer Name</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. Ravi Kumar"
                  value={customerName}
                  disabled={readOnly}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  Customer Phone
                  {showDetected && (
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
                  This number receives the bill on WhatsApp when the WhatsApp Business integration
                  is connected.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus} disabled={readOnly}>
                  <SelectTrigger className="h-9 text-sm capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                {/* Column Headers (hidden on tiny screens, shown on sm+) */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-3">Item Name</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Disc %</div>
                  <div className="col-span-1">GST</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
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
                            placeholder="Medicine name"
                            value={item.medicineName}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { medicineName: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
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
                        <div className="col-span-3 sm:col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="h-8 text-xs"
                            placeholder="Price"
                            value={item.unitPrice}
                            disabled={readOnly}
                            onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
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
                        <div className="col-span-3 sm:col-span-1">
                          <Select
                            value={String(Number(item.gstRate) || 0)}
                            onValueChange={(v) => updateItem(idx, { gstRate: Number(v) })}
                            disabled={readOnly}
                          >
                            <SelectTrigger className="h-8 text-xs px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {gstOptions(item.gstRate).map((r) => (
                                <SelectItem key={r} value={String(r)} className="text-xs">
                                  {r}%
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          GST +{currency}
                          {money(lt.gst)}
                        </span>
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
                placeholder="Optional remarks for this bill"
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
              GST{" "}
              <span className="font-mono font-semibold text-foreground">+{money(totals.gst)}</span>
            </div>
            <div className="text-muted-foreground">
              Round Off{" "}
              <span className="font-mono font-semibold text-foreground">{money(roundOff)}</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              Grand Total{" "}
              <span className="font-mono">
                {currency}
                {money(grandTotal)}
              </span>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            {readOnly ? (
              <div className="flex items-center justify-between gap-2 w-full">
                <div>
                  {bill?.kind === "bill" && bill?.documentType === "sales_invoice" && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 text-xs gap-1.5"
                        disabled={sendingWhatsApp}
                        onClick={handleSendWhatsApp}
                      >
                        {sendingWhatsApp ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5" />
                        )}
                        Send on WhatsApp
                      </Button>
                      <span className="text-[10px] text-muted-foreground max-w-[200px]">
                        {bill.whatsapp?.status === "sent"
                          ? "Delivered to the customer's WhatsApp."
                          : bill.whatsapp?.status === "failed"
                            ? "Delivery failed — you can retry."
                            : "Not delivered to WhatsApp yet."}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
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
                  {isEdit ? "Save Changes" : "Save Bill"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate bill dialog */}
      <AlertDialog
        open={duplicate.open}
        onOpenChange={(next) => !next && setDuplicate((d) => ({ ...d, open: false }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">This bill already exists</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              A bill numbered <span className="font-mono font-semibold">{duplicate.invoiceNo}</span>{" "}
              already exists for this date in your pharmacy. View the existing bill, or cancel and
              choose a different bill number.
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
