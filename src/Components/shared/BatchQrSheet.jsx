import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Layers, Printer } from "lucide-react";
import { toast } from "sonner";
import { batchGroupQrDataUrl, batchQrDataUrl } from "@/lib/batch-export";
import { printHtml } from "@/lib/print";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

const labelStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "10px",
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  backgroundColor: "#ffffff",
};

function buildPrintHtml(items, groupUrl) {
  const groupCard = groupUrl
    ? `
      <div style="${Object.entries(labelStyle)
        .map(([k, v]) => `${k}:${v}`)
        .join(";")};page-break-inside:avoid;flex-direction:column;">
        <div style="font-weight:700;font-size:14px;">Group QR · ${items.length} batches</div>
        <div style="display:flex;gap:10px;align-items:flex-start;margin-top:6px;">
          <img src="${groupUrl}" width="110" height="110" style="flex:none;" />
          <div style="font-size:11px;color:#475569;">
            ${items.map(({ batch }) => batch.batchNumber).join("<br />")}
          </div>
        </div>
      </div>`
    : "";
  const cards = items
    .map(
      ({ batch, med, dataUrl }) => `
      <div style="${Object.entries(labelStyle)
        .map(([k, v]) => `${k}:${v}`)
        .join(";")};page-break-inside:avoid;">
        <img src="${dataUrl}" width="90" height="90" style="flex:none;" />
        <div style="min-width:0;">
          <div style="font-weight:700;font-size:14px;">${batch.batchNumber}</div>
          <div style="font-size:11px;color:#475569;margin-top:2px;">${med?.name ?? "—"}</div>
          <div style="font-size:11px;color:#475569;">Expiry: ${batch.dates?.expiryDate ?? "—"}</div>
          <div style="font-size:11px;color:#475569;">Qty: ${batch.stock?.quantityOnHand ?? 0}</div>
        </div>
      </div>`,
    )
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 12px; }
    .labels { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .group { margin-bottom: 12px; }
    @media print { .labels { grid-template-columns: 1fr 1fr; } }
    @media print { .group { page-break-after: always; } }
  </style></head><body>
    ${groupUrl ? `<div class="group">${groupCard}</div>` : ""}
    <div class="labels">${cards}</div>
  </body></html>`;
}

export default function BatchQrSheet({ open, onOpenChange, items }) {
  const [qrMap, setQrMap] = useState({});
  const [groupUrl, setGroupUrl] = useState(null);
  const [generating, setGenerating] = useState(false);

  const normalized = useMemo(() => items ?? [], [items]);

  useEffect(() => {
    if (!open || normalized.length === 0) return;
    let cancelled = false;
    setGenerating(true);
    setGroupUrl(null);
    (async () => {
      const entries = [];
      for (const item of normalized) {
        try {
          const dataUrl = await batchQrDataUrl(item.batch, item.med);
          entries.push([item.batch.id, dataUrl]);
        } catch (e) {
          console.error("QR generation failed:", e);
        }
      }
      let group = null;
      try {
        group = await batchGroupQrDataUrl(normalized);
      } catch (e) {
        console.error("Group QR generation failed:", e);
      }
      if (cancelled) return;
      setQrMap(Object.fromEntries(entries));
      setGroupUrl(group);
      setGenerating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, normalized]);

  const handlePrint = () => {
    const itemsWithQr = normalized
      .map((item) => ({ ...item, dataUrl: qrMap[item.batch.id] }))
      .filter((item) => item.dataUrl);
    if (!itemsWithQr.length) return toast.error("No QR codes generated yet");
    printHtml(buildPrintHtml(itemsWithQr, groupUrl));
  };

  const handlePdf = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("portrait");

      if (groupUrl) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PharmaHub - Group Batch QR", 105, 28, { align: "center" });
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`${normalized.length} batches`, 105, 36, { align: "center" });
        const imgSize = 80;
        doc.addImage(groupUrl, "PNG", (210 - imgSize) / 2, 44, imgSize, imgSize);
        doc.setFontSize(9);
        const names = normalized.map(({ batch }) => batch.batchNumber);
        doc.text(doc.splitTextToSize(names.join(" · "), 180), 15, 136);
        doc.addPage();
      }

      const margin = 12;
      const gap = 8;
      const labelW = 92;
      const labelH = 44;
      const cols = 2;
      const rowsPerPage = 5;
      let pageIndex = 0;
      normalized.forEach((item, i) => {
        const dataUrl = qrMap[item.batch.id];
        if (!dataUrl) return;
        const perPage = cols * rowsPerPage;
        const page = Math.floor(i / perPage);
        if (page !== pageIndex) {
          doc.addPage();
          pageIndex = page;
        }
        const col = i % cols;
        const row = Math.floor((i % perPage) / cols);
        const x = margin + col * (labelW + gap);
        const y = margin + row * (labelH + gap);
        doc.setDrawColor(200);
        doc.rect(x, y, labelW, labelH);
        doc.addImage(dataUrl, "PNG", x + 3, y + 3, 26, 26);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(item.batch.batchNumber, x + 33, y + 10);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(item.med?.name ?? "—", labelW - 36), x + 33, y + 18);
        doc.text(`Expiry: ${item.batch.dates?.expiryDate ?? "—"}`, x + 33, y + 32);
        doc.text(`Qty: ${item.batch.stock?.quantityOnHand ?? 0}`, x + 33, y + 38);
      });
      doc.save(`PharmaHub_Batch_QR_Labels_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("QR labels exported to PDF");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const readyCount = normalized.filter((item) => qrMap[item.batch.id]).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>QR labels ({normalized.length})</DialogTitle>
          <DialogDescription>
            {generating
              ? "Generating QR codes…"
              : "Individual QR per batch, plus a single group QR for all selected batches."}
          </DialogDescription>
        </DialogHeader>

        {generating ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-1">
            {groupUrl && (
              <div className="flex items-start gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <img
                  src={groupUrl}
                  alt="Group QR for all selected batches"
                  className="h-28 w-28 shrink-0 rounded border border-border bg-white"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Layers className="h-4 w-4 text-primary" /> Group QR
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    One code that scans to all {normalized.length} selected batches.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {normalized.map(({ batch }) => (
                      <span
                        key={batch.id}
                        className="rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                      >
                        {batch.batchNumber}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {normalized.map((item) => {
                const dataUrl = qrMap[item.batch.id];
                return (
                  <div
                    key={item.batch.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    {dataUrl ? (
                      <img
                        src={dataUrl}
                        alt={`QR for ${item.batch.batchNumber}`}
                        className="h-20 w-20 shrink-0 rounded border border-border bg-white"
                      />
                    ) : (
                      <div className="grid h-20 w-20 shrink-0 place-items-center rounded border border-dashed border-border text-[10px] text-muted-foreground">
                        No QR
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-bold text-foreground">
                        {item.batch.batchNumber}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-foreground">
                        {item.med?.name ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Expiry: {item.batch.dates?.expiryDate ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Qty: {item.batch.stock?.quantityOnHand ?? 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={generating || readyCount === 0}
            onClick={handlePrint}
          >
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button size="sm" disabled={generating || readyCount === 0} onClick={handlePdf}>
            <Download className="mr-1.5 h-4 w-4" /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
