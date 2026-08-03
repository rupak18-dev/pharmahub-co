import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement, logActivity } from "@/lib/stock";
import { downloadCsv } from "@/lib/csv";
import { downloadXls } from "@/lib/xls";
import { printHtml } from "@/lib/print";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeFilter } from "@/components/pharmacy/expiry/TimeFilter";
import { NotificationsPopover } from "@/components/pharmacy/expiry/NotificationsPopover";
import { ExpiryOverview } from "@/components/pharmacy/expiry/ExpiryOverview";
import { ExpiryInventory } from "@/components/pharmacy/expiry/ExpiryInventory";
import { ExpiryReports } from "@/components/pharmacy/expiry/ExpiryReports";
import { ExpiryLedgers } from "@/components/pharmacy/expiry/ExpiryLedgers";
import { RecommendationPanel } from "@/components/pharmacy/expiry/RecommendationPanel";
import { BatchDrawer } from "@/components/pharmacy/expiry/BatchDrawer";
import { MedicineDrawer } from "@/components/pharmacy/expiry/MedicineDrawer";
import {
  DiscountDialog,
  ReturnDialog,
  TransferDialog,
} from "@/components/pharmacy/expiry/ExpiryDialogs";
import {
  BRANCHES,
  DEFAULT_WINDOW,
  buildNotifications,
  inWindow,
  isReturnable,
  matchesStatusFilter,
  reportRows,
  windowLabel,
  type ExpiryRow,
  type SortKey,
  type StatusFilterValue,
  type WindowState,
} from "@/lib/expiry";

export const Route = createFileRoute("/_authenticated/dashboard/expiry")({
  head: () => ({ meta: [{ title: "Medicine Expiry · PharmacyOS" }] }),
  component: ExpiryPage,
});

type View = "overview" | "inventory" | "reports" | "ledgers";

function ExpiryPage() {
  const { user } = useAuth();
  const has = usePermission();
  const batches = useDb((d) => d.batches);
  const medicines = useDb((d) => d.medicines);
  const categories = useDb((d) => d.categories);
  const manufacturers = useDb((d) => d.manufacturers);
  const suppliers = useDb((d) => d.suppliers);
  const currency = useDb((d) => d.settings.currency);
  const autoSwap = useDb((d) => d.settings.autoSwap ?? false);
  const writeOffs = useDb((d) => d.writeOffs);
  const creditNotes = useDb((d) => d.creditNotes);
  const readFromStore = useDb((d) => d.notificationsRead);
  const stockMovements = useDb((d) => d.stockMovements);

  const now = useMemo(() => Date.now(), []);

  const [view, setView] = useState<View>("overview");
  const [window, setWindow] = useState<WindowState>(DEFAULT_WINDOW);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilterValue>("all");
  const [category, setCategory] = useState("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [branch, setBranch] = useState("all");
  const [shelf, setShelf] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recBatchId, setRecBatchId] = useState<string | null>(null);
  const [recOpen, setRecOpen] = useState(false);
  const [returnRow, setReturnRow] = useState<ExpiryRow | null>(null);
  const [discountRow, setDiscountRow] = useState<ExpiryRow | null>(null);
  const [transferRow, setTransferRow] = useState<ExpiryRow | null>(null);
  const [viewBatchRow, setViewBatchRow] = useState<ExpiryRow | null>(null);
  const [viewMedicineId, setViewMedicineId] = useState<string | null>(null);
  const [focusTableToken, setFocusTableToken] = useState(0);

  const medById = useMemo(() => new Map(medicines.map((m) => [m.id, m])), [medicines]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const mfrById = useMemo(() => new Map(manufacturers.map((m) => [m.id, m.name])), [manufacturers]);
  const supById = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers]);

  const medicineCategory = useCallback(
    (id: string) => catById.get(medById.get(id)?.categoryId ?? "") ?? "—",
    [medById, catById],
  );
  const medicineManufacturer = useCallback(
    (id: string) => mfrById.get(medById.get(id)?.manufacturerId ?? "") ?? "—",
    [medById, mfrById],
  );
  const supplierName = useCallback(
    (id?: string) => (id ? (supById.get(id) ?? "Unknown") : "—"),
    [supById],
  );

  const rows = useMemo(
    () => reportRows(batches, medicines, categories, manufacturers, suppliers, window, now),
    [batches, medicines, categories, manufacturers, suppliers, window, now],
  );

  const filteredRows = useMemo(() => {
    let list = rows;
    if (status === "all") {
      list = list.filter((r) => inWindow(r.batch, window, now));
    } else {
      list = list.filter((r) => matchesStatusFilter(r, status));
    }
    if (category !== "all") {
      list = list.filter((r) => medById.get(r.batch.medicineId)?.categoryId === category);
    }
    if (manufacturer !== "all") {
      list = list.filter((r) => medById.get(r.batch.medicineId)?.manufacturerId === manufacturer);
    }
    if (branch !== "all") {
      list = list.filter((r) => (r.batch.branch ?? BRANCHES[0]) === branch);
    }
    if (shelf !== "all") {
      list = list.filter((r) => r.shelf === shelf);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.medicineName, r.salt, r.batchNumber, r.manufacturer, r.supplier].some((s) =>
          s.toLowerCase().includes(q),
        ),
      );
    }
    if (sort) {
      const mul = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
        return String(av).localeCompare(String(bv)) * mul;
      });
    }
    return list;
  }, [rows, status, window, category, manufacturer, branch, shelf, query, sort, medById, now]);

  const shelves = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.shelf).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [rows],
  );

  const drawerMedicine = useMemo(
    () => (viewMedicineId ? (medById.get(viewMedicineId) ?? null) : null),
    [viewMedicineId, medById],
  );
  const drawerBatches = useMemo(
    () => (viewMedicineId ? batches.filter((b) => b.medicineId === viewMedicineId) : []),
    [viewMedicineId, batches],
  );
  const drawerMovements = useMemo(
    () =>
      viewBatchRow
        ? stockMovements
            .filter((m) => m.batchId === viewBatchRow.batch.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [],
    [viewBatchRow, stockMovements],
  );

  const notifications = useMemo(
    () => buildNotifications(batches, medicines, supplierName, now),
    [batches, medicines, supplierName, now],
  );
  const readIds = useMemo(() => new Set(readFromStore), [readFromStore]);

  const canDispose = has("expiry", "update") || has("expiry", "approve");

  const onShow = (focus: string | undefined) => {
    setView("inventory");
    setStatus((focus as StatusFilterValue) ?? "all");
  };

  const onSort = (key: SortKey) => {
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    setSelected((s) =>
      s.size === filteredRows.length ? new Set() : new Set(filteredRows.map((r) => r.batch.id)),
    );
  };
  const clearSelection = () => setSelected(new Set());

  const requireUser = () => {
    if (!user) {
      toast.error("Sign in required");
      return null;
    }
    return user;
  };

  const doReturn = (row: ExpiryRow, qty: number, netValue: number, creditNoteNo?: string) => {
    const u = requireUser();
    if (!u) return;
    applyStockMovement({
      medicineId: row.batch.medicineId,
      batchId: row.batch.id,
      movementType: "out",
      quantity: qty,
      reason: "Returned to supplier (expiry management)",
      userId: u.id,
      userName: u.name,
    });
    const nowIso = new Date().toISOString();
    db.set((d) => {
      d.creditNotes.unshift({
        id: db.uid(),
        batchId: row.batch.id,
        batchNumber: row.batchNumber,
        medicineId: row.batch.medicineId,
        medicineName: row.medicineName,
        supplierId: row.batch.supplierId ?? "",
        supplierName: row.supplier,
        units: qty,
        value: Math.round(netValue),
        expectedBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "expected",
        creditNoteNo,
        createdAt: nowIso,
      });
    });
    setSelected((s) => {
      const n = new Set(s);
      n.delete(row.batch.id);
      return n;
    });
    toast.success(
      `Return created · credit note expected: ${currency}${Math.round(netValue).toLocaleString()}`,
    );
  };

  const doDiscount = (row: ExpiryRow, pct: number) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const b = d.batches.find((x) => x.id === row.batch.id);
      if (b) b.discountPct = pct;
    });
    logActivity({
      userId: u.id,
      userName: u.name,
      action: `Quick-sale ${pct}% discount flagged on ${row.medicineName}`,
      entityType: "batch",
      entityId: row.batch.id,
      details: { pct },
    });
    toast.success(`${pct}% discount will auto-apply at POS for ${row.medicineName}`);
  };

  const clearDiscount = (row: ExpiryRow) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const b = d.batches.find((x) => x.id === row.batch.id);
      if (b) delete b.discountPct;
    });
    logActivity({
      userId: u.id,
      userName: u.name,
      action: `Removed discount flag on ${row.medicineName}`,
      entityType: "batch",
      entityId: row.batch.id,
    });
    toast.success(`Discount flag cleared`);
  };

  const doPriority = (row: ExpiryRow) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const b = d.batches.find((x) => x.id === row.batch.id);
      if (b) b.fefo = true;
    });
    logActivity({
      userId: u.id,
      userName: u.name,
      action: `Prioritized ${row.medicineName} for FEFO billing`,
      entityType: "batch",
      entityId: row.batch.id,
    });
    toast.success(`${row.medicineName} will bill first at the counter (FEFO)`);
  };

  const clearPriority = (row: ExpiryRow) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const b = d.batches.find((x) => x.id === row.batch.id);
      if (b) b.fefo = false;
    });
    toast.success(`FEFO priority cleared`);
  };

  const doSuggest = (row: ExpiryRow) => {
    const u = requireUser();
    if (!u) return;
    const next = !row.batch.suggestAtPos;
    db.set((d) => {
      const b = d.batches.find((x) => x.id === row.batch.id);
      if (b) b.suggestAtPos = next;
    });
    logActivity({
      userId: u.id,
      userName: u.name,
      action: next
        ? `Marked ${row.medicineName} to suggest at POS`
        : `Stopped suggesting ${row.medicineName} at POS`,
      entityType: "batch",
      entityId: row.batch.id,
    });
    toast.success(next ? "Will be suggested at the counter as a swap" : "POS suggestion removed");
  };

  const doTransfer = (row: ExpiryRow, branch: string, qty: number) => {
    const u = requireUser();
    if (!u) return;
    const fromBranch = row.batch.branch ?? BRANCHES[0];
    if (branch === fromBranch) {
      toast.error("Stock is already in that branch");
      return;
    }
    applyStockMovement({
      medicineId: row.batch.medicineId,
      batchId: row.batch.id,
      movementType: "out",
      quantity: qty,
      reason: `Transferred to ${branch} (expiry management)`,
      userId: u.id,
      userName: u.name,
    });
    const nowIso = new Date().toISOString();
    db.set((d) => {
      d.transfers.unshift({
        id: db.uid(),
        batchId: row.batch.id,
        batchNumber: row.batchNumber,
        medicineId: row.batch.medicineId,
        medicineName: row.medicineName,
        fromBranch,
        toBranch: branch,
        units: qty,
        unitCost: row.batch.purchasePrice,
        doneByUserId: u.id,
        doneByName: u.name,
        createdAt: nowIso,
      });
    });
    logActivity({
      userId: u.id,
      userName: u.name,
      action: `Transferred ${qty} units of ${row.medicineName} → ${branch}`,
      entityType: "batch",
      entityId: row.batch.id,
      details: { branch, qty },
    });
    toast.success(`${qty} units transferred to ${branch}`);
  };

  const writeOff = (u: { id: string; name: string }, row: ExpiryRow) => {
    const costValue = row.quantity * row.batch.purchasePrice;
    const gstRate = row.medicine?.gstRate ?? 12;
    const gstAmount = Math.round((costValue * gstRate) / 100);
    db.set((d) => {
      d.writeOffs.unshift({
        id: db.uid(),
        batchId: row.batch.id,
        batchNumber: row.batchNumber,
        medicineId: row.batch.medicineId,
        medicineName: row.medicineName,
        units: row.quantity,
        unitCost: row.batch.purchasePrice,
        costValue,
        gstRate,
        gstAmount,
        total: costValue + gstAmount,
        reason: "Expired — disposed via expiry management",
        doneByUserId: u.id,
        doneByName: u.name,
        createdAt: new Date().toISOString(),
      });
    });
  };

  const doDispose = (row: ExpiryRow) => {
    const u = requireUser();
    if (!u) return;
    if (
      !confirm(`Dispose ${row.quantity} units of ${row.medicineName}? Stock will be written off.`)
    )
      return;
    applyStockMovement({
      medicineId: row.batch.medicineId,
      batchId: row.batch.id,
      movementType: "adjustment",
      quantity: -row.quantity,
      reason: "Disposed — expired (expiry management)",
      userId: u.id,
      userName: u.name,
    });
    writeOff(u, row);
    setSelected((s) => {
      const n = new Set(s);
      n.delete(row.batch.id);
      return n;
    });
    toast.success(`${row.medicineName} disposed · write-off + GST posted to ledger`);
  };

  const doBulkReturn = (list: ExpiryRow[]) => {
    const u = requireUser();
    if (!u) return;
    const eligible = list.filter(isReturnable);
    eligible.forEach((r) => {
      applyStockMovement({
        medicineId: r.batch.medicineId,
        batchId: r.batch.id,
        movementType: "out",
        quantity: r.quantity,
        reason: "Bulk return to supplier (expiry management)",
        userId: u.id,
        userName: u.name,
      });
      db.set((d) => {
        d.creditNotes.unshift({
          id: db.uid(),
          batchId: r.batch.id,
          batchNumber: r.batchNumber,
          medicineId: r.batch.medicineId,
          medicineName: r.medicineName,
          supplierId: r.batch.supplierId ?? "",
          supplierName: r.supplier,
          units: r.quantity,
          value: Math.round(r.quantity * r.batch.purchasePrice),
          expectedBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "expected",
          createdAt: new Date().toISOString(),
        });
      });
    });
    clearSelection();
    toast.success(`Return created for ${eligible.length} batch(es)`);
  };

  const doBulkDispose = (list: ExpiryRow[]) => {
    const u = requireUser();
    if (!u) return;
    if (!confirm(`Dispose ${list.length} batch(es)? Stock will be written off.`)) return;
    list.forEach((r) => {
      applyStockMovement({
        medicineId: r.batch.medicineId,
        batchId: r.batch.id,
        movementType: "adjustment",
        quantity: -r.quantity,
        reason: "Bulk dispose — expired (expiry management)",
        userId: u.id,
        userName: u.name,
      });
      writeOff(u, r);
    });
    clearSelection();
    toast.success(`${list.length} batch(es) disposed · GST write-offs posted`);
  };

  const toggleAutoSwap = () => {
    db.set((d) => {
      d.settings.autoSwap = !d.settings.autoSwap;
    });
    toast.success("Auto-swap at POS " + (db.get().settings.autoSwap ? "enabled" : "disabled"));
  };

  const markCreditReceived = (id: string, creditNoteNo?: string) => {
    db.set((d) => {
      const cn = d.creditNotes.find((c) => c.id === id);
      if (cn) {
        cn.status = "received";
        if (creditNoteNo) cn.creditNoteNo = creditNoteNo;
        cn.receivedOn = new Date().toISOString();
      }
    });
    toast.success("Credit note marked as received");
  };

  const reconcileCredit = (id: string) => {
    db.set((d) => {
      const cn = d.creditNotes.find((c) => c.id === id);
      if (cn) {
        cn.status = "reconciled";
        cn.reconciledOn = new Date().toISOString();
      }
    });
    toast.success("Credit note reconciled against supplier statement");
  };

  const openRecommendations = (batchId: string) => {
    setRecBatchId(batchId);
    setRecOpen(true);
  };

  const markRead = (id: string) => {
    db.set((d) => {
      if (!d.notificationsRead.includes(id)) d.notificationsRead.push(id);
    });
  };
  const markAllRead = () => {
    db.set((d) => {
      d.notificationsRead = Array.from(
        new Set([...d.notificationsRead, ...notifications.map((n) => n.id)]),
      );
    });
    toast.success("All alerts marked as read");
  };
  const jumpToBatch = (batchId: string) => {
    setView("inventory");
    openRecommendations(batchId);
  };

  const exportTable = (format: "csv" | "xls") => {
    const data = filteredRows.map((r) => ({
      medicine: r.medicineName,
      salt: r.salt,
      batch: r.batchNumber,
      manufacturer: r.manufacturer,
      category: r.category,
      expiry: r.expiryDate,
      daysRemaining: r.days,
      quantity: r.quantity,
      stockValue: r.stockValue,
      shelf: r.shelf,
      supplier: r.supplier,
      status: r.bucket,
    }));
    if (format === "csv") {
      downloadCsv(`expiry-inventory-${Date.now()}.csv`, data);
    } else {
      downloadXls(`expiry-inventory-${Date.now()}.xls`, data, "Expiry inventory");
    }
    toast.success(`Inventory exported as ${format.toUpperCase()}`);
  };

  const printLabel = (row: ExpiryRow) => {
    const med = medById.get(row.batch.medicineId);
    const strength = med?.strength ? ` ${med.strength}` : "";
    const dose = med?.dosageForm ? ` · ${med.dosageForm}` : "";
    const branchName = row.batch.branch ?? BRANCHES[0];
    const html = [
      "<!doctype html><html><head><meta charset='utf-8'>",
      "<style>",
      "@page{size:100mm 60mm;margin:0}",
      "*{box-sizing:border-box}",
      "body{margin:0;font-family:system-ui,Arial,sans-serif;color:#111}",
      ".label{width:100mm;height:60mm;padding:8mm 9mm;border:2px solid #111;display:flex;flex-direction:column;justify-content:space-between}",
      ".name{font-size:17px;font-weight:700;line-height:1.2}",
      ".salt{font-size:11px;color:#555;margin-top:2px}",
      ".meta{display:flex;justify-content:space-between;font-size:12px;margin-top:6px}",
      ".exp{font-size:12px;font-weight:600;margin-top:6px}",
      ".price{display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px}",
      ".sell{font-size:16px;font-weight:700}",
      ".mrp{font-size:11px;color:#555;text-decoration:line-through}",
      ".foot{display:flex;justify-content:space-between;font-size:9px;color:#777;border-top:1px dashed #bbb;padding-top:4px}",
      "</style></head><body>",
      '<div class="label">',
      `<div><div class="name">${row.medicineName}${strength}</div><div class="salt">${row.salt}${dose}</div></div>`,
      `<div><div class="meta"><span>Batch <b>${row.batchNumber}</b></span><span>Shelf <b>${row.shelf}</b></span></div>`,
      `<div class="exp">Exp ${new Date(row.expiryDate).toLocaleDateString()} — ${
        row.days < 0 ? `overdue ${Math.abs(row.days)}d` : `${row.days}d left`
      }</div></div>`,
      `<div class="price"><span class="sell">${currency}${row.batch.sellingPrice.toFixed(2)}</span><span class="mrp">MRP ${currency}${row.batch.mrp.toFixed(2)}</span></div>`,
      `<div class="foot"><span>PharmacyOS · ${branchName}</span><span>${new Date().toLocaleDateString()}</span></div>`,
      "</div></body></html>",
    ].join("");
    printHtml(html, () => toast.error("Label printing unavailable in this browser"));
    toast.success("Shelf label sent to printer");
  };

  const exportReport = (kind: string, format: "csv" | "pdf" | "xls") => {
    const rowsFor = (filter: (r: ExpiryRow) => boolean) =>
      rows.filter(filter).map((r) => ({
        medicine: r.medicineName,
        batch: r.batchNumber,
        manufacturer: r.manufacturer,
        supplier: r.supplier,
        expiry: r.expiryDate,
        daysRemaining: r.days,
        quantity: r.quantity,
        stockValue: r.stockValue,
        shelf: r.shelf,
      }));
    const name =
      kind === "near"
        ? "near-expiry"
        : kind === "expired"
          ? "expired"
          : kind === "manufacturer"
            ? "manufacturer-wise"
            : kind === "loss"
              ? "financial-loss"
              : "returns";
    const data =
      kind === "near"
        ? rowsFor((r) => r.days > 0 && r.days <= 30)
        : kind === "expired"
          ? rowsFor((r) => r.days < 0)
          : kind === "manufacturer"
            ? rowsFor(() => true)
            : kind === "loss"
              ? rowsFor((r) => r.days <= 30)
              : rowsFor((r) => r.days >= -30 && r.days <= 30);
    if (format === "csv") {
      downloadCsv(`${name}-${Date.now()}.csv`, data);
      toast.success(`${name} CSV exported`);
      return;
    }
    if (format === "xls") {
      downloadXls(`${name}-${Date.now()}.xls`, data, name);
      toast.success(`${name} exported as Excel`);
      return;
    }
    const title =
      kind === "near"
        ? "Near Expiry Report"
        : kind === "expired"
          ? "Expired Medicines Report"
          : kind === "manufacturer"
            ? "Manufacturer-wise Report"
            : kind === "loss"
              ? "Financial Loss Report"
              : "Return Report";
    const html = [
      "<!doctype html><html><head><meta charset='utf-8'><title>" + title + "</title>",
      "<style>",
      "body{font-family:system-ui,Arial,sans-serif;color:#111;padding:32px}",
      "h1{font-size:20px;margin:0 0 4px}",
      ".sub{color:#666;font-size:12px;margin-bottom:24px}",
      "table{width:100%;border-collapse:collapse;font-size:12px}",
      "th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd}",
      "th{background:#f4f4f5;font-weight:600}",
      ".num{text-align:right;font-variant-numeric:tabular-nums}",
      "@media print{body{print-color-adjust:exact}}",
      "</style></head><body>",
      `<h1>${title}</h1>`,
      `<div class="sub">PharmacyOS · Generated ${new Date().toLocaleString()} · ${data.length} batches</div>`,
      "<table><thead><tr>",
      ["Medicine", "Batch", "Manufacturer", "Supplier", "Expiry", "Days", "Qty", "Value", "Shelf"]
        .map((h) => `<th>${h}</th>`)
        .join(""),
      "</tr></thead><tbody>",
      data
        .map(
          (r) =>
            `<tr><td>${r.medicine}</td><td>${r.batch}</td><td>${r.manufacturer}</td><td>${r.supplier}</td><td>${r.expiry}</td><td class="num">${r.daysRemaining}</td><td class="num">${r.quantity}</td><td class="num">${r.stockValue}</td><td>${r.shelf}</td></tr>`,
        )
        .join(""),
      "</tbody></table>",
      "</body></html>",
    ].join("");
    printHtml(html, () => toast.error("PDF export unavailable in this browser"));
    toast.success(`${title} opened for printing — choose “Save as PDF”`);
  };

  const onSaveSchedule = (payload: {
    frequency: "daily" | "weekly" | "monthly";
    email: string;
    whatsapp: boolean;
    reports: string[];
  }) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      d.reportSchedules.unshift({
        id: db.uid(),
        ...payload,
        createdBy: u.id,
        createdByName: u.name,
        createdAt: new Date().toISOString(),
      });
      d.activityLogs.unshift({
        id: db.uid(),
        userId: u.id,
        userName: u.name,
        action: `Delivery schedule saved · ${payload.frequency} → ${payload.email}`,
        entityType: "report_schedule",
        details: payload,
        createdAt: new Date().toISOString(),
      });
    });
    toast.success("Delivery schedule saved");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl xl:text-4xl">
              Medicine Expiry
            </h1>
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
              {rows.filter((r) => r.days <= 7).length} medicines require attention
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track medicines nearing expiry, reduce losses, and recover eligible stock.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <Button
            size="sm"
            onClick={() => {
              setView("inventory");
              setStatus("return");
            }}
            className="h-8 min-h-[44px] flex-1 cursor-pointer text-xs font-semibold shadow-xs sm:min-h-[36px] sm:flex-none"
          >
            Start Recovery
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setView("overview");
              setFocusTableToken((t) => t + 1);
            }}
            className="h-8 min-h-[44px] flex-1 cursor-pointer text-xs font-semibold shadow-xs sm:min-h-[36px] sm:flex-none"
          >
            Review Medicines
          </Button>

          <NotificationsPopover
            notifications={notifications}
            readIds={readIds}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onJump={jumpToBatch}
          />
          <TimeFilter value={window} onChange={setWindow} />
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="grid w-full grid-cols-4 sm:inline-flex sm:w-auto">
          <TabsTrigger value="overview" className="px-1 text-xs sm:px-3 sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="inventory" className="px-1 text-xs sm:px-3 sm:text-sm">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" className="px-1 text-xs sm:px-3 sm:text-sm">
            Reports
          </TabsTrigger>
          <TabsTrigger value="ledgers" className="px-1 text-xs sm:px-3 sm:text-sm">
            Ledgers
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "overview" && (
        <ExpiryOverview
          batches={batches}
          window={window}
          currency={currency}
          medicineCategory={medicineCategory}
          medicineManufacturer={medicineManufacturer}
          supplierName={supplierName}
          onShow={onShow}
          onReturnRow={(row) => setReturnRow(row)}
          onDiscountRow={(row) => setDiscountRow(row)}
          onTransferRow={(row) => setTransferRow(row)}
          onDisposeRow={(row) => user && writeOff(user, row)}
          onViewBatchRow={(row) => setViewBatchRow(row)}
          onViewMedicineId={(id) => setViewMedicineId(id)}
          focusTableToken={focusTableToken}
        />
      )}

      {view === "inventory" && (
        <ExpiryInventory
          rows={filteredRows}
          currency={currency}
          query={query}
          onQueryChange={setQuery}
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          manufacturer={manufacturer}
          onManufacturerChange={setManufacturer}
          branch={branch}
          onBranchChange={setBranch}
          shelf={shelf}
          onShelfChange={setShelf}
          categories={categories}
          manufacturers={manufacturers}
          shelves={shelves}
          sort={sort}
          onSort={onSort}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onClearSelection={clearSelection}
          onOpenRecommendations={openRecommendations}
          onReturn={setReturnRow}
          onDiscount={setDiscountRow}
          onClearDiscount={clearDiscount}
          onPriority={doPriority}
          onClearPriority={clearPriority}
          onSuggest={doSuggest}
          onTransfer={setTransferRow}
          onDispose={doDispose}
          canDispose={canDispose}
          onBulkReturn={doBulkReturn}
          onBulkDispose={doBulkDispose}
          onExport={exportTable}
          onViewBatch={setViewBatchRow}
          onViewMedicine={setViewMedicineId}
          onPrintLabel={printLabel}
        />
      )}

      {view === "reports" && (
        <ExpiryReports
          rows={rows}
          currency={currency}
          onExport={exportReport}
          onSaveSchedule={onSaveSchedule}
        />
      )}

      {view === "ledgers" && (
        <ExpiryLedgers
          writeOffs={writeOffs}
          creditNotes={creditNotes}
          currency={currency}
          onMarkReceived={markCreditReceived}
          onReconcile={reconcileCredit}
        />
      )}

      <RecommendationPanel
        open={recOpen}
        onOpenChange={setRecOpen}
        batchId={recBatchId}
        rows={rows}
        batches={batches}
        medicines={medicines}
        currency={currency}
        supplierName={supplierName}
        onReturn={(r) => {
          setRecOpen(false);
          setReturnRow(r);
        }}
        onDiscount={(r) => {
          setRecOpen(false);
          setDiscountRow(r);
        }}
        onTransfer={(r) => {
          setRecOpen(false);
          setTransferRow(r);
        }}
        onPriority={(r) => {
          setRecOpen(false);
          doPriority(r);
        }}
        onSuggest={(r) => {
          setRecOpen(false);
          doSuggest(r);
        }}
        autoSwap={autoSwap}
        onToggleAutoSwap={toggleAutoSwap}
        windowLabel={windowLabel(window)}
      />

      <ReturnDialog
        row={returnRow}
        open={!!returnRow}
        onOpenChange={(o) => !o && setReturnRow(null)}
        onConfirm={doReturn}
        currency={currency}
        supplierName={supplierName}
      />
      <DiscountDialog
        row={discountRow}
        open={!!discountRow}
        onOpenChange={(o) => !o && setDiscountRow(null)}
        onConfirm={doDiscount}
        currency={currency}
      />
      <TransferDialog
        row={transferRow}
        open={!!transferRow}
        onOpenChange={(o) => !o && setTransferRow(null)}
        onConfirm={doTransfer}
        currency={currency}
      />

      <BatchDrawer
        row={viewBatchRow}
        open={!!viewBatchRow}
        onOpenChange={(o) => !o && setViewBatchRow(null)}
        currency={currency}
        movements={drawerMovements}
      />
      <MedicineDrawer
        medicine={drawerMedicine}
        open={!!viewMedicineId}
        onOpenChange={(o) => !o && setViewMedicineId(null)}
        currency={currency}
        categoryName={drawerMedicine ? medicineCategory(drawerMedicine.id) : "—"}
        manufacturerName={drawerMedicine ? medicineManufacturer(drawerMedicine.id) : "—"}
        batches={drawerBatches}
        medicines={medicines}
        supplierName={supplierName}
      />
    </div>
  );
}
