import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileUp,
  Image as ImageIcon,
  Loader2,
  ScanSearch,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { reportService } from "@/lib/reportService";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
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
import { BillFormModal } from "./BillFormModal";
import { PurchaseFormModal } from "./PurchaseFormModal";
import { PURCHASE_DOCUMENT_TYPES } from "./purchaseDocumentTypes";

const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Mirrors the backend uploader (multer): image types it will actually OCR and
// the default 10 MB limit (BILL_MAX_BYTES). Rejected client-side so the user
// gets a clear message instead of a server 413/415 round-trip.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// The OCR-detected supplier number must never become the customer/WhatsApp
// number. Only a number explicitly classified as a customer candidate may
// prefill that field; a number that the OCR tagged as belonging to the
// supplier is blanked out even if it also appeared as a customer.
function safeCustomerPhone(fields) {
  const raw = fields?.customerPhone || fields?.party?.phone || "";
  if (!raw) return "";
  const supplierNumbers = new Set(
    (fields?.phoneCandidates ?? [])
      .filter((c) => c.role === "supplier")
      .map((c) => c.normalizedNumber)
      .filter(Boolean),
  );
  return supplierNumbers.has(raw) ? "" : raw;
}

function supplierNumbersFrom(fields) {
  return new Set(
    (fields?.phoneCandidates ?? [])
      .filter((c) => c.role === "supplier")
      .map((c) => c.normalizedNumber)
      .filter(Boolean),
  );
}

// Maps a server extraction result to the shape the bill/purchase forms accept,
// so "Review & Save" opens with the OCR fields prefilled. Totals are never
// copied into the form — the server recomputes them from the line items.
function extractionToInitialData(ext, isPurchase) {
  const fields = ext?.fields;
  if (!fields) return null;
  if (isPurchase) {
    return {
      invoiceNo: fields.invoiceNumber,
      purchaseDate: fields.invoiceDate,
      supplier: fields.supplier?.name,
      supplierPhone: fields.supplier?.phones?.[0] || fields.supplier?.phone || "",
      party: { gstin: fields.supplier?.gstin },
      customerPhone: safeCustomerPhone(fields),
      phoneCandidates: fields.phoneCandidates ?? [],
      printedGrandTotal: fields.printedGrandTotal ?? null,
      items: (fields.items ?? []).map((i) => ({
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
        expiryDate: i.expiryDate ?? "",
        manufacturer: i.manufacturer ?? "",
      })),
    };
  }
  return {
    invoiceNo: fields.invoiceNumber,
    billDate: fields.invoiceDate,
    customerName: fields.party?.name,
    customerPhone: safeCustomerPhone(fields),
    phoneCandidates: fields.phoneCandidates ?? [],
    items: (fields.items ?? []).map((i) => ({
      medicineName: i.medicineName ?? "",
      quantity: i.quantity ?? 1,
      unitPrice: i.unitCost ?? "",
      discountPct: i.discountPct ?? 0,
      gstRate: i.gstRate ?? 0,
    })),
  };
}

function ExtractionSummary({ fields, isPurchase, currency }) {
  const customerPhone = safeCustomerPhone(fields);
  const supplierPhone = fields?.supplier?.phones?.[0] || fields?.supplier?.phone || "";
  const phones = fields?.phoneCandidates ?? [];
  const supplierNumbers = supplierNumbersFrom(fields);
  const customerCount = phones.filter(
    (c) => c.role === "customer" && !supplierNumbers.has(c.normalizedNumber),
  ).length;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
      <div className="truncate">
        Invoice <span className="font-mono font-semibold">{fields?.invoiceNumber || "—"}</span>
      </div>
      <div className="truncate">
        Date <span className="font-mono font-semibold">{fields?.invoiceDate || "—"}</span>
      </div>
      <div className="truncate">
        {isPurchase ? "Supplier" : "Party"}{" "}
        <span className="font-semibold">
          {(isPurchase ? fields?.supplier?.name : fields?.party?.name) || "—"}
        </span>
      </div>
      <div className="truncate">
        Items <span className="font-semibold">{fields?.items?.length ?? 0}</span>
      </div>
      <div className="truncate">
        Customer WhatsApp{" "}
        <span className="font-mono font-semibold">
          {customerPhone ? (
            <>
              {customerPhone}
              {customerCount > 1 && (
                <span className="ml-1 text-[9px] text-muted-foreground">
                  +{customerCount - 1} more
                </span>
              )}
            </>
          ) : (
            "not found"
          )}
        </span>
      </div>
      <div className="truncate">
        {isPurchase ? "Supplier Phone" : "Phone"}{" "}
        <span className="font-mono font-semibold">{supplierPhone || "—"}</span>
      </div>
      <div className="truncate">
        Printed Total{" "}
        <span className="font-mono font-semibold">
          {Number(fields?.printedGrandTotal) > 0
            ? `${currency}${money(fields.printedGrandTotal)}`
            : "—"}
        </span>
      </div>
    </div>
  );
}

function ExtractionWarnings({ warnings, tone = "emerald" }) {
  if (!warnings || warnings.length === 0) return null;
  const textClass = tone === "emerald" ? "text-green-700/80" : "text-amber-700/80";
  return (
    <ul className={`list-disc pl-4 space-y-0.5 text-[10px] ${textClass}`}>
      {warnings.map((w, i) => (
        <li key={i}>{w}</li>
      ))}
    </ul>
  );
}

function DocumentTypeSelect({ value, onChange, tone = "emerald" }) {
  const textClass = tone === "emerald" ? "text-green-800" : "text-amber-800";
  return (
    <div className="space-y-1.5 pt-1">
      <Label className={`text-[11px] font-medium ${textClass}`}>
        What type of document is this?
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PURCHASE_DOCUMENT_TYPES.map((d) => (
            <SelectItem key={d.value} value={d.value} className="text-xs">
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function UploadBillModal({ open, onOpenChange, currency = "₹", onSaved, type = "auto" }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [documentType, setDocumentType] = useState("purchase_invoice");
  const [showForm, setShowForm] = useState(false);
  const [dragging, setDragging] = useState(false);

  // "auto" picks the side from the OCR-detected document type once extracted;
  // the document type select is shown so the user can switch sides freely.
  const isPurchase =
    type === "sales" ? false : type === "purchases" ? true : documentType !== "sales_invoice";

  useEffect(() => {
    if (!open) {
      setFile(null);
      setUploadResult(null);
      setShowForm(false);
      setUploading(false);
      setDocumentType("purchase_invoice");
      setDragging(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [open, previewUrl]);

  const pickFile = (selected) => {
    const f = selected?.[0];
    if (!f) return;
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
      toast.error("Please choose a JPEG, PNG or WEBP image.");
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error("Image is larger than 10 MB. Please choose a smaller photo or scan.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setUploadResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer?.files);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const result = isPurchase
        ? await reportService.uploadPurchaseDocument(file)
        : await reportService.uploadBillImage(file);
      setUploadResult(result);
      toast.success(
        result?.extraction?.status === "extracted"
          ? result?.extraction?.lowConfidence
            ? "Details were read with low confidence — please review them before saving."
            : "Text extracted. Review the details and save the record."
          : "Image uploaded. Review the details and save the record.",
      );
    } catch (err) {
      toast.error(err?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const extraction = uploadResult?.extraction;
  const isExtracted = extraction?.status === "extracted";
  const isLowConfidence = Boolean(isExtracted && extraction?.lowConfidence);
  const fields = extraction?.fields;
  // Stable reference while the form is open: the "Review & Save" forms reset
  // their fields whenever `initialData` changes identity, so a parent re-render
  // (e.g. the bill list refreshing after a save) must not recreate it.
  const initialData = useMemo(
    () => extractionToInitialData(extraction, isPurchase),
    [extraction, isPurchase],
  );

  useEffect(() => {
    if (!isExtracted || !extraction?.documentType) return;
    if (PURCHASE_DOCUMENT_TYPES.some((d) => d.value === extraction.documentType)) {
      setDocumentType(extraction.documentType);
    }
  }, [uploadResult, isExtracted, extraction]);

  const title = isPurchase ? "Upload Purchase Document" : "Upload Bill";
  const description = isPurchase
    ? "Upload a photo or scan of a purchase invoice. The server reads it with OCR, then you review and save the prefilled record — or enter the details manually. PDF is not supported."
    : "Upload a photo or scan of a bill. The server reads it with OCR, then you review and save the prefilled record — or enter the details manually. PDF is not supported.";

  return (
    <>
      <Dialog open={open && !showForm} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              {isPurchase ? (
                <ShoppingCart className="h-4 w-4 text-primary" />
              ) : (
                <FileUp className="h-4 w-4 text-primary" />
              )}
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File drop zone */}
            <label
              htmlFor="bill-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="max-h-44 rounded-md object-contain border border-border"
                />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    Click to choose a JPEG, PNG or WEBP image
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    or drag &amp; drop a photo / take one with your camera
                  </p>
                </>
              )}
            </label>
            <Input
              id="bill-file"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => pickFile(e.target.files)}
            />

            {file && !uploadResult && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}

            {/* Upload / extraction result */}
            {uploadResult && isExtracted ? (
              isLowConfidence ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ScanSearch className="h-4 w-4" />
                    <p className="text-xs font-semibold">Review extracted details</p>
                    <span className="ml-auto inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      {Number.isFinite(Number(extraction.confidence))
                        ? `${extraction.confidence}% confidence`
                        : "confidence —"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700/80">{extraction.message}</p>
                  <ExtractionSummary fields={fields} isPurchase={isPurchase} currency={currency} />
                  <ExtractionWarnings warnings={extraction.warnings} tone="amber" />
                  {type !== "sales" ? (
                    <DocumentTypeSelect
                      value={documentType}
                      onChange={setDocumentType}
                      tone="amber"
                    />
                  ) : (
                    <p className="text-[11px] text-amber-700/80">
                      Correct anything that looks wrong below — the image stays attached to the
                      record.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <ScanSearch className="h-4 w-4" />
                    <p className="text-xs font-semibold">Text extracted — review before saving</p>
                    <span className="ml-auto inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      {Number.isFinite(Number(extraction.confidence))
                        ? `${extraction.confidence}% confidence`
                        : "confidence —"}
                    </span>
                  </div>
                  <ExtractionSummary fields={fields} isPurchase={isPurchase} currency={currency} />
                  <ExtractionWarnings warnings={extraction.warnings} />
                  {type !== "sales" && (
                    <DocumentTypeSelect value={documentType} onChange={setDocumentType} />
                  )}
                </div>
              )
            ) : (
              uploadResult && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ScanSearch className="h-4 w-4" />
                    <p className="text-xs font-semibold">Automatic extraction unavailable</p>
                  </div>
                  <p className="text-[11px] text-amber-700/80">
                    {uploadResult.extraction?.message}
                  </p>
                  {type !== "sales" ? (
                    <DocumentTypeSelect
                      value={documentType}
                      onChange={setDocumentType}
                      tone="amber"
                    />
                  ) : (
                    <p className="text-[11px] text-amber-700/80">
                      Enter the bill details below — the image stays attached to the record.
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {!uploadResult ? (
              <Button
                type="button"
                size="sm"
                className="h-9 text-xs font-semibold gap-1.5"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileUp className="h-3.5 w-3.5" />
                )}
                {uploading ? "Scanning…" : "Upload Image"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-9 text-xs font-semibold gap-1.5"
                onClick={() => setShowForm(true)}
              >
                {isPurchase ? (
                  <ShoppingCart className="h-3.5 w-3.5" />
                ) : (
                  <Receipt className="h-3.5 w-3.5" />
                )}
                {isPurchase ? "Review &amp; Save Purchase" : "Review &amp; Save Bill"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPurchase ? (
        <PurchaseFormModal
          open={open && showForm}
          onOpenChange={(next) => {
            if (!next) onOpenChange(false);
          }}
          currency={currency}
          source="uploaded"
          defaultDocumentType={documentType}
          initialData={initialData}
          extraction={extraction}
          uploadedFile={
            uploadResult?.file
              ? {
                  filename: uploadResult.file.filename,
                  path: uploadResult.file.path,
                  mimeType: uploadResult.file.mimeType,
                  size: uploadResult.file.size,
                }
              : null
          }
          onSaved={onSaved}
        />
      ) : (
        <BillFormModal
          open={open && showForm}
          onOpenChange={(next) => {
            if (!next) onOpenChange(false);
          }}
          currency={currency}
          source="uploaded"
          initialData={initialData}
          extraction={extraction}
          uploadedFile={
            uploadResult?.file
              ? {
                  filename: uploadResult.file.filename,
                  path: uploadResult.file.path,
                  mimeType: uploadResult.file.mimeType,
                  size: uploadResult.file.size,
                }
              : null
          }
          onSaved={onSaved}
        />
      )}
    </>
  );
}
