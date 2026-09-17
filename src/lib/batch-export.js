import { format, isValid } from "date-fns";
import QRCode from "qrcode";
import { downloadCsv } from "@/lib/csv";

const safeDate = (dateStr, fmt = "dd MMM yyyy") => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "—";
};

const titleCase = (s) => (s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : s);

export const BATCH_EXPORT_COLUMNS = [
  { id: "batchNumber", label: "Batch Number", value: (r) => r.batch.batchNumber },
  {
    id: "medicine",
    label: "Medicine",
    value: (r) => [r.med?.name, r.med?.generic].filter(Boolean).join(" · "),
  },
  {
    id: "rack",
    label: "Rack / Zone",
    value: (r) =>
      r.locations.map((l) => [l.locationType, l.rackCode].filter(Boolean).join(" · ")).join(", "),
  },
  { id: "quantity", label: "Available Qty", value: (r) => r.totalStock },
  { id: "mfg", label: "Mfg Date", value: (r) => safeDate(r.batch.dates?.manufacturingDate) },
  { id: "expiry", label: "Expiry Date", value: (r) => safeDate(r.batch.dates?.expiryDate) },
  { id: "status", label: "Status", value: (r) => titleCase(r.status) },
];

export function visibleExportColumns(visibleFields) {
  return BATCH_EXPORT_COLUMNS.filter(
    (c) => visibleFields.length === 0 || visibleFields.includes(c.id),
  );
}

export function buildBatchExportRows(rows, visibleFields) {
  const columns = visibleExportColumns(visibleFields);
  return {
    columns,
    rows: rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, c.value(r)]))),
  };
}

export function exportBatchesCsv(rows, visibleFields) {
  const { columns, rows: dataRows } = buildBatchExportRows(rows, visibleFields);
  if (!dataRows.length) return false;
  const filename = `PharmaHub_Batches_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCsv(
    filename,
    dataRows,
    columns.map((c) => c.label),
  );
  return true;
}

export async function exportBatchesPdf(rows, visibleFields) {
  const { columns, rows: dataRows } = buildBatchExportRows(rows, visibleFields);
  if (!dataRows.length) return false;
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF("landscape");
  doc.setFontSize(16);
  doc.text("PharmaHub - Batches", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    head: [columns.map((c) => c.label)],
    body: dataRows.map((r) => columns.map((c) => r[c.label] ?? "")),
    startY: 25,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 122, 135] },
  });
  doc.save(`PharmaHub_Batches_${new Date().toISOString().split("T")[0]}.pdf`);
  return true;
}

export function batchQrPayload(batch, med) {
  return [
    `Batch: ${batch.batchNumber}`,
    `Medicine: ${med?.name ?? "—"}`,
    `Expiry: ${safeDate(batch.dates?.expiryDate)}`,
    `Qty: ${batch.stock?.quantityOnHand ?? 0}`,
  ].join("\n");
}

export async function batchQrDataUrl(batch, med) {
  return QRCode.toDataURL(batchQrPayload(batch, med), {
    width: 240,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

export function batchGroupQrPayload(items) {
  const lines = [
    `PharmaHub · Batch Group (${items.length})`,
    ...items.map(({ batch }) => `• ${batch.batchNumber}`),
  ];
  return lines.join("\n");
}

export async function batchGroupQrDataUrl(items) {
  return QRCode.toDataURL(batchGroupQrPayload(items), {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "L",
  });
}
