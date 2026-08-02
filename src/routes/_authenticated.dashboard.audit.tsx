import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, ChevronsUpDown } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { applyStockMovement } from "@/lib/stock";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  AUDIT_TYPE_LABEL,
  BRANCHES,
  auditScopeItems,
  buildAuditScope,
  countsForAudit,
  deriveVariances,
  nextAuditNumber,
  severityForValue,
} from "@/lib/audit";
import { AuditOverview } from "@/components/pharmacy/audit/AuditOverview";
import { AuditCalendar } from "@/components/pharmacy/audit/AuditCalendar";
import { AuditManagement } from "@/components/pharmacy/audit/AuditManagement";
import { LiveAudit } from "@/components/pharmacy/audit/LiveAudit";
import { LiveAuditHome } from "@/components/pharmacy/audit/LiveAuditHome";
import { VarianceReview } from "@/components/pharmacy/audit/VarianceReview";
import { Approvals } from "@/components/pharmacy/audit/Approvals";
import { ActivityLogView } from "@/components/pharmacy/audit/ActivityLogView";
import { CreateAuditSheet } from "@/components/pharmacy/audit/CreateAuditSheet";
import { AuditDrawer } from "@/components/pharmacy/audit/AuditDrawer";
import type {
  ActivityLog,
  AdjustmentAction,
  Audit,
  AuditCount,
  AuditTimelineEvent,
  DB,
  RecommendedAction,
  StockAdjustment,
  VarianceItem,
} from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/audit")({
  head: () => ({ meta: [{ title: "Audit log Â· PharmaHub" }] }),
  component: AuditPage,
});

type View = "overview" | "calendar" | "audits" | "live" | "variance" | "approvals" | "activity";

const VIEW_LABELS: Record<View, string> = {
  overview: "Overview",
  calendar: "Calendar",
  audits: "Audits",
  live: "Live Audit",
  variance: "Variance Review",
  approvals: "Approvals",
  activity: "Activity Log",
};

const VIEW_ORDER: View[] = [
  "overview",
  "calendar",
  "audits",
  "live",
  "variance",
  "approvals",
  "activity",
];

export interface CountExtra {
  note?: string;
  photo?: string;
  voiceNote?: string;
  device?: string;
}

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  if (/iPad|iPhone/i.test(ua)) return "iPhone · Camera";
  if (/Android/i.test(ua)) return "Android · Camera";
  return "Web · Chrome";
}

function AuditPage() {
  const { user } = useAuth();
  const has = usePermission();
  const audits = useDb((d) => d.audits);
  const counts = useDb((d) => d.auditCounts);
  const variances = useDb((d) => d.variances);
  const adjustments = useDb((d) => d.adjustments);
  const activityLogs = useDb((d) => d.activityLogs);
  const batches = useDb((d) => d.batches);
  const medicines = useDb((d) => d.medicines);
  const categories = useDb((d) => d.categories);
  const profiles = useDb((d) => d.profiles);
  const currency = useDb((d) => d.settings.currency);

  const [view, setView] = useState<View>("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [liveAuditId, setLiveAuditId] = useState<string | null>(null);

  const requireUser = () => {
    if (!user) {
      toast.error("Sign in required");
      return null;
    }
    return user;
  };

  const tl = (action: AuditTimelineEvent["action"], note?: string): AuditTimelineEvent => {
    const u = user;
    return {
      id: db.uid(),
      action,
      at: new Date().toISOString(),
      byUserId: u?.id ?? "",
      byName: u?.name ?? "System",
      ...(note ? { note } : {}),
    };
  };

  const pushLog = (d: DB, entry: Omit<ActivityLog, "id" | "createdAt">) => {
    d.activityLogs.unshift({ ...entry, id: db.uid(), createdAt: new Date().toISOString() });
    if (d.activityLogs.length > 500) d.activityLogs.length = 500;
  };

  const selectedAudit = useMemo(
    () => audits.find((a) => a.id === selectedAuditId) ?? null,
    [audits, selectedAuditId],
  );
  const liveAudit = useMemo(
    () => audits.find((a) => a.id === liveAuditId) ?? null,
    [audits, liveAuditId],
  );

  const selectedCounts = useMemo(
    () => (selectedAudit ? countsForAudit(selectedAudit.id, counts) : []),
    [selectedAudit, counts],
  );
  const liveItems = useMemo(
    () => (liveAudit ? auditScopeItems(liveAudit, batches, medicines, counts) : []),
    [liveAudit, batches, medicines, counts],
  );

  const createAudit = (input: {
    type: Audit["type"];
    title: string;
    branch: string;
    categoryId?: string;
    shelf?: string;
    batchIds?: string[];
    assignedUserIds: string[];
    scheduledDate: string;
    notes?: string;
  }) => {
    const u = requireUser();
    if (!u) return;
    const batchIds = buildAuditScope({
      type: input.type,
      batches,
      medicines,
      branch: input.branch,
      categoryId: input.categoryId,
      shelf: input.shelf,
      batchIds: input.batchIds,
    });
    const nowIso = new Date().toISOString();
    const audit: Audit = {
      id: db.uid(),
      auditNumber: nextAuditNumber(audits),
      type: input.type,
      title: input.title || `${input.branch} · ${AUDIT_TYPE_LABEL[input.type]}`,
      branch: input.branch,
      categoryId: input.categoryId,
      shelf: input.shelf,
      batchIds,
      assignedUserIds: input.assignedUserIds,
      scheduledDate: input.scheduledDate,
      status: "scheduled",
      createdBy: u.id,
      createdByName: u.name,
      createdAt: nowIso,
      notes: input.notes,
      timeline: [tl("created", `${batchIds.length} batches in scope`)],
    };
    db.set((d) => {
      d.audits.unshift(audit);
      pushLog(d, {
        userId: u.id,
        userName: u.name,
        action: `Audit created · ${audit.auditNumber}`,
        entityType: "audit",
        entityId: audit.id,
        auditId: audit.id,
        details: { type: input.type, branch: input.branch, scope: batchIds.length },
        branch: input.branch,
        device: deviceLabel(),
      });
    });
    setCreateOpen(false);
    toast.success(`${audit.auditNumber} scheduled · ${batchIds.length} batches in scope`);
    return audit;
  };

  const setAuditStatus = (
    id: string,
    patch: Partial<Audit>,
    event: AuditTimelineEvent,
    logAction: string,
    opts?: { branch?: string; reason?: string },
  ) => {
    db.set((d) => {
      const a = d.audits.find((x) => x.id === id);
      if (!a) return;
      Object.assign(a, patch);
      a.timeline.push(event);
      pushLog(d, {
        userId: event.byUserId,
        userName: event.byName,
        action: logAction,
        entityType: "audit",
        entityId: id,
        auditId: id,
        oldValue: undefined,
        newValue: patch.status ?? a.status,
        reason: opts?.reason,
        branch: opts?.branch ?? a.branch,
        device: deviceLabel(),
      });
    });
  };

  const startAudit = (id: string) => {
    const u = requireUser();
    if (!u) return;
    const audit = audits.find((a) => a.id === id);
    if (!audit) return;
    if (!audit.batchIds.length) {
      toast.error("Audit has no batches in scope");
      return;
    }
    setAuditStatus(
      id,
      { status: "in_progress", startedAt: new Date().toISOString() },
      tl("started"),
      `Audit started · ${audit.auditNumber}`,
    );
    toast.success("Audit started — begin counting");
  };

  const pauseAudit = (id: string) => {
    const u = requireUser();
    if (!u) return;
    const audit = audits.find((a) => a.id === id);
    if (!audit) return;
    setAuditStatus(
      id,
      { status: "paused", pausedAt: new Date().toISOString() },
      tl("paused"),
      `Audit paused · ${audit.auditNumber}`,
    );
    toast.success("Audit paused — progress saved");
  };

  const resumeAudit = (id: string) => {
    const u = requireUser();
    if (!u) return;
    const audit = audits.find((a) => a.id === id);
    if (!audit) return;
    setAuditStatus(
      id,
      { status: "in_progress", pausedAt: undefined },
      tl("resumed"),
      `Audit resumed · ${audit.auditNumber}`,
    );
    toast.success("Audit resumed");
  };

  const cancelAudit = (id: string) => {
    const u = requireUser();
    if (!u) return;
    const audit = audits.find((a) => a.id === id);
    if (!audit) return;
    if (!confirm(`Cancel ${audit.auditNumber}? Counted data will be kept for reference.`)) return;
    setAuditStatus(
      id,
      { status: "cancelled" },
      tl("cancelled"),
      `Audit cancelled · ${audit.auditNumber}`,
    );
    toast.success("Audit cancelled");
  };

  const submitAudit = (id: string) => {
    const u = requireUser();
    if (!u) return;
    const audit = audits.find((a) => a.id === id);
    if (!audit) return;
    const derived = deriveVariances(audit, counts, batches);
    db.set((d) => {
      d.variances = d.variances.filter((v) => v.auditId !== id);
      d.variances.unshift(...derived);
      const a = d.audits.find((x) => x.id === id);
      if (a) {
        a.status = "pending_review";
        a.submittedAt = new Date().toISOString();
        a.timeline.push(tl("submitted", `${derived.length} variance line(s)`));
      }
      pushLog(d, {
        userId: u.id,
        userName: u.name,
        action: `Audit submitted for review · ${audit.auditNumber}`,
        entityType: "audit",
        entityId: id,
        auditId: id,
        oldValue: "in_progress",
        newValue: "pending_review",
        branch: a?.branch,
        device: deviceLabel(),
      });
    });
    toast.success(
      derived.length
        ? `${derived.length} variance(s) ready for review`
        : "No variances found — audit is accurate",
    );
  };

  const maybeComplete = (d: DB, auditId: string) => {
    const a = d.audits.find((x) => x.id === auditId);
    if (!a || a.status !== "pending_review") return;
    const vs = d.variances.filter((v) => v.auditId === auditId);
    const allResolved = vs.every((v) => v.status === "approved" || v.status === "rejected");
    if (allResolved) {
      a.status = "completed";
      a.completedAt = new Date().toISOString();
      a.timeline.push(tl("completed"));
      pushLog(d, {
        userId: user?.id ?? "",
        userName: user?.name ?? "System",
        action: `Audit completed · ${a.auditNumber}`,
        entityType: "audit",
        entityId: auditId,
        auditId,
        oldValue: "pending_review",
        newValue: "completed",
        branch: a.branch,
        device: deviceLabel(),
      });
    }
  };

  const upsertCount = (
    d: DB,
    auditId: string,
    batchId: string,
    patch: Partial<AuditCount> & { physicalQty?: number; skipped?: boolean },
  ) => {
    const audit = d.audits.find((a) => a.id === auditId);
    const batch = d.batches.find((b) => b.id === batchId);
    if (!audit || !batch) return;
    const existing = d.auditCounts.find((c) => c.auditId === auditId && c.batchId === batchId);
    const merged: AuditCount = {
      id: existing?.id ?? db.uid(),
      auditId,
      batchId,
      medicineId: batch.medicineId,
      medicineName: d.medicines.find((m) => m.id === batch.medicineId)?.name ?? "—",
      batchNumber: batch.batchNumber,
      shelf: batch.shelfLocation ?? "—",
      expectedQty: existing?.expectedQty ?? batch.currentStock,
      physicalQty: existing?.physicalQty,
      countedBy: existing?.countedBy ?? user?.id ?? "",
      countedByName: existing?.countedByName ?? user?.name ?? "System",
      countedAt: new Date().toISOString(),
      device: existing?.device ?? deviceLabel(),
      skipped: existing?.skipped ?? false,
      flagged: existing?.flagged ?? false,
      ...patch,
    };
    if (existing) Object.assign(existing, merged);
    else d.auditCounts.unshift(merged);
  };

  const submitCount = (
    auditId: string,
    batchId: string,
    physicalQty: number,
    extra?: CountExtra,
  ) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      upsertCount(d, auditId, batchId, { physicalQty, ...extra });
      const audit = d.audits.find((a) => a.id === auditId);
      const batch = d.batches.find((b) => b.id === batchId);
      pushLog(d, {
        userId: u.id,
        userName: u.name,
        action: `Count recorded · ${d.medicines.find((m) => m.id === batch?.medicineId)?.name ?? "—"} · ${physicalQty}`,
        entityType: "audit_count",
        entityId: batchId,
        auditId,
        details: {
          batch: batch?.batchNumber,
          expected: batch?.currentStock,
          physical: physicalQty,
        },
        branch: audit?.branch,
        device: extra?.device ?? deviceLabel(),
      });
    });
  };

  const skipBatch = (auditId: string, batchId: string) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      upsertCount(d, auditId, batchId, { skipped: true, physicalQty: undefined });
    });
  };

  const flagBatch = (auditId: string, batchId: string, extra?: CountExtra) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      upsertCount(d, auditId, batchId, { flagged: true, ...extra });
    });
    toast.success("Item flagged for review");
  };

  const setVarianceReason = (id: string, reason: VarianceItem["reason"]) => {
    db.set((d) => {
      const v = d.variances.find((x) => x.id === id);
      if (v) v.reason = reason;
    });
  };

  const setManagerComment = (id: string, comment: string) => {
    db.set((d) => {
      const v = d.variances.find((x) => x.id === id);
      if (v) v.managerComment = comment;
    });
  };

  const requestRecount = (varianceId: string) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const v = d.variances.find((x) => x.id === varianceId);
      if (!v) return;
      v.status = "recount_requested";
      v.recommendedAction = "recount";
      const a = d.audits.find((x) => x.id === v.auditId);
      if (a) a.timeline.push(tl("recount_requested", `${v.medicineName} needs recounting`));
      pushLog(d, {
        userId: u.id,
        userName: u.name,
        action: `Recount requested · ${v.medicineName}`,
        entityType: "variance",
        entityId: v.id,
        auditId: v.auditId,
        branch: a?.branch,
        device: deviceLabel(),
      });
    });
    toast.success("Recount requested — staff can confirm the corrected count");
  };

  const confirmRecount = (varianceId: string, newQty: number) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const v = d.variances.find((x) => x.id === varianceId);
      if (!v) return;
      const batch = d.batches.find((b) => b.id === v.batchId);
      const diff = newQty - v.expectedQty;
      const unit = batch?.purchasePrice ?? v.unitCost;
      v.actualQty = newQty;
      v.difference = diff;
      v.varianceValue = Math.abs(diff) * unit;
      v.severity = severityForValue(v.varianceValue);
      v.status = "recount_confirmed";
      const c = d.auditCounts.find((x) => x.auditId === v.auditId && x.batchId === v.batchId);
      if (c) c.physicalQty = newQty;
      const a = d.audits.find((x) => x.id === v.auditId);
      if (a) a.timeline.push(tl("recount_confirmed", `${v.medicineName} confirmed at ${newQty}`));
      pushLog(d, {
        userId: u.id,
        userName: u.name,
        action: `Recount confirmed · ${v.medicineName} · ${newQty}`,
        entityType: "variance",
        entityId: v.id,
        auditId: v.auditId,
        details: { newQty },
        branch: a?.branch,
        device: deviceLabel(),
      });
    });
    toast.success("Recount confirmed — variance updated");
  };

  const applyVarianceAction = (
    varianceId: string,
    action: RecommendedAction,
    targetBranch?: string,
  ) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const v = d.variances.find((x) => x.id === varianceId);
      if (!v) return;
      v.recommendedAction = action;
      if (action === "reject") {
        v.status = "rejected";
        v.managerComment = v.managerComment ?? "No adjustment — variance not accepted.";
        const a = d.audits.find((x) => x.id === v.auditId);
        pushLog(d, {
          userId: u.id,
          userName: u.name,
          action: `Variance rejected · ${v.medicineName}`,
          entityType: "variance",
          entityId: v.id,
          auditId: v.auditId,
          oldValue: "pending",
          newValue: "rejected",
          branch: a?.branch,
          device: deviceLabel(),
        });
        maybeComplete(d, v.auditId);
        return;
      }
      if (action === "recount") {
        v.status = "recount_requested";
        return;
      }
      const adjAction: AdjustmentAction = action === "approve" ? "adjust" : action;
      const audit = d.audits.find((a) => a.id === v.auditId);
      const adj: StockAdjustment = {
        id: db.uid(),
        auditId: v.auditId,
        batchId: v.batchId,
        medicineId: v.medicineId,
        medicineName: v.medicineName,
        batchNumber: v.batchNumber,
        action: adjAction,
        quantity: adjAction === "adjust" ? v.difference : Math.abs(v.difference),
        unitCost: v.unitCost,
        varianceId: v.id,
        reason: v.reason ?? "unknown",
        severity: v.severity,
        targetBranch:
          adjAction === "transfer"
            ? (targetBranch ?? BRANCHES.find((b) => b !== audit?.branch) ?? BRANCHES[0])
            : undefined,
        submittedBy: u.id,
        submittedByName: u.name,
        createdAt: new Date().toISOString(),
        status: "pending_supervisor",
        history: [
          {
            id: db.uid(),
            action: "Submitted by staff",
            userId: u.id,
            userName: u.name,
            at: new Date().toISOString(),
          },
        ],
      };
      d.adjustments.unshift(adj);
      pushLog(d, {
        userId: u.id,
        userName: u.name,
        action: `Adjustment submitted · ${v.medicineName} (${adjAction})`,
        entityType: "adjustment",
        entityId: adj.id,
        auditId: v.auditId,
        details: { reason: v.reason, qty: adj.quantity, action: adjAction },
        branch: audit?.branch,
        device: deviceLabel(),
      });
    });
    toast.success(
      action === "approve"
        ? "Adjustment sent for approval"
        : `Adjustment (${action}) sent for approval`,
    );
  };

  const approveAdjustment = (id: string) => {
    const u = requireUser();
    if (!u) return;
    const adj = adjustments.find((a) => a.id === id);
    if (!adj) return;
    db.set((d) => {
      const a = d.adjustments.find((x) => x.id === id);
      if (!a) return;
      const now = new Date().toISOString();
      if (a.status === "pending_supervisor") {
        a.status = "pending_manager";
        a.approverId = u.id;
        a.approverName = u.name;
        a.approvedAt = now;
        a.history.push({
          id: db.uid(),
          action: "Approved (Supervisor)",
          userId: u.id,
          userName: u.name,
          at: now,
        });
        pushLog(d, {
          userId: u.id,
          userName: u.name,
          action: `Adjustment approved (Supervisor) · ${a.medicineName}`,
          entityType: "adjustment",
          entityId: id,
          auditId: a.auditId,
          oldValue: "pending_supervisor",
          newValue: "pending_manager",
          branch: d.audits.find((x) => x.id === a.auditId)?.branch,
          device: deviceLabel(),
        });
        toast.success("Supervisor approval recorded — needs manager approval");
        return;
      }
      if (a.status === "pending_manager") {
        a.status = "approved";
        a.approverId = u.id;
        a.approverName = u.name;
        a.approvedAt = now;
        a.history.push({
          id: db.uid(),
          action: "Approved (Manager)",
          userId: u.id,
          userName: u.name,
          at: now,
        });
        pushLog(d, {
          userId: u.id,
          userName: u.name,
          action: `Adjustment approved (Manager) · ${a.medicineName}`,
          entityType: "adjustment",
          entityId: id,
          auditId: a.auditId,
          oldValue: "pending_manager",
          newValue: "approved",
          branch: d.audits.find((x) => x.id === a.auditId)?.branch,
          device: deviceLabel(),
        });
        toast.success("Manager approval recorded — inventory can be updated");
        return;
      }
      if (a.status === "approved") {
        // Apply: update inventory now
        try {
          if (a.action === "adjust") {
            applyStockMovement({
              medicineId: a.medicineId,
              batchId: a.batchId,
              movementType: "adjustment",
              quantity: a.quantity,
              reason: `Stock audit adjustment · ${a.auditId}`,
              userId: u.id,
              userName: u.name,
            });
          } else if (a.action === "transfer") {
            applyStockMovement({
              medicineId: a.medicineId,
              batchId: a.batchId,
              movementType: "out",
              quantity: a.quantity,
              reason: `Audit transfer → ${a.targetBranch}`,
              userId: u.id,
              userName: u.name,
            });
            d.transfers.unshift({
              id: db.uid(),
              batchId: a.batchId,
              batchNumber: a.batchNumber,
              medicineId: a.medicineId,
              medicineName: a.medicineName,
              fromBranch: d.audits.find((x) => x.id === a.auditId)?.branch ?? BRANCHES[0],
              toBranch: a.targetBranch ?? BRANCHES[1],
              units: a.quantity,
              unitCost: a.unitCost,
              doneByUserId: u.id,
              doneByName: u.name,
              createdAt: now,
            });
          } else {
            applyStockMovement({
              medicineId: a.medicineId,
              batchId: a.batchId,
              movementType: "adjustment",
              quantity: -Math.abs(a.quantity),
              reason: `Audit write-off · ${a.auditId}`,
              userId: u.id,
              userName: u.name,
            });
            const gstRate = d.medicines.find((m) => m.id === a.medicineId)?.gstRate ?? 12;
            const costValue = a.quantity * a.unitCost;
            const gstAmount = Math.round((costValue * gstRate) / 100);
            d.writeOffs.unshift({
              id: db.uid(),
              batchId: a.batchId,
              batchNumber: a.batchNumber,
              medicineId: a.medicineId,
              medicineName: a.medicineName,
              units: a.quantity,
              unitCost: a.unitCost,
              costValue,
              gstRate,
              gstAmount,
              total: costValue + gstAmount,
              reason: "Stock audit write-off",
              doneByUserId: u.id,
              doneByName: u.name,
              createdAt: now,
            });
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to apply adjustment");
          return;
        }
        a.status = "applied";
        a.appliedAt = now;
        a.appliedBy = u.id;
        a.appliedByName = u.name;
        a.history.push({
          id: db.uid(),
          action: "Inventory updated",
          userId: u.id,
          userName: u.name,
          at: now,
        });
        const v = d.variances.find((x) => x.id === a.varianceId);
        if (v) v.status = "approved";
        const audit = d.audits.find((x) => x.id === a.auditId);
        if (audit)
          audit.timeline.push(tl("adjustment_applied", `${a.medicineName} adjusted in stock`));
        pushLog(d, {
          userId: u.id,
          userName: u.name,
          action: `Inventory updated · ${a.medicineName}`,
          entityType: "adjustment",
          entityId: id,
          auditId: a.auditId,
          oldValue: "approved",
          newValue: "applied",
          reason: `${a.medicineName} ${a.action}`,
          branch: audit?.branch,
          device: deviceLabel(),
        });
        maybeComplete(d, a.auditId);
        toast.success("Inventory updated");
      }
    });
  };

  const rejectAdjustment = (id: string) => {
    const u = requireUser();
    if (!u) return;
    db.set((d) => {
      const a = d.adjustments.find((x) => x.id === id);
      if (!a || a.status === "applied" || a.status === "rejected") return;
      a.status = "rejected";
      a.history.push({
        id: db.uid(),
        action: "Rejected",
        userId: u.id,
        userName: u.name,
        at: new Date().toISOString(),
      });
      const v = d.variances.find((x) => x.id === a.varianceId);
      if (v) v.status = "rejected";
      maybeComplete(d, a.auditId);
      pushLog(d, {
        userId: u.id,
        userName: u.name,
        action: `Adjustment rejected · ${a.medicineName}`,
        entityType: "adjustment",
        entityId: id,
        auditId: a.auditId,
        oldValue: a.status,
        newValue: "rejected",
        branch: d.audits.find((x) => x.id === a.auditId)?.branch,
        device: deviceLabel(),
      });
    });
    toast.success("Adjustment rejected — no stock change");
  };

  const openLive = (auditId: string) => {
    setLiveAuditId(auditId);
    setView("live");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 overflow-x-hidden md:space-y-6">
      <PageHeader
        title="Stock Audit"
        description="Plan, execute, and reconcile physical stock against the book — end to end."
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search action, user, detailsâ€¦" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No log entries" description="Adjust filters or record some activity first." />
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => (
                <tr key={l.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(l)}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{format(new Date(l.createdAt), "MMM d, HH:mm:ss")}</td>
                  <td className="px-4 py-2.5">{l.userName}</td>
                  <td className="px-4 py-2.5 font-medium">{l.action}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Activity detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3 text-sm">
              <Field label="Action" value={selected.action} />
              <Field label="User" value={selected.userName} />
              <Field label="Entity" value={`${selected.entityType}${selected.entityId ? ` Â· ${selected.entityId}` : ""}`} />
              <Field label="When" value={format(new Date(selected.createdAt), "PPpp")} />
              {selected.details && (
                <div>
                  <p className="text-xs text-muted-foreground">Details</p>
                  <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
