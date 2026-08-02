import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { downloadCsv } from "@/lib/csv";
import { format } from "date-fns";
import type { ActivityLog } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/audit")({
  head: () => ({ meta: [{ title: "Audit log Â· PharmaHub" }] }),
  component: AuditPage,
});

function AuditPage() {
  const logs = useDb((d) => d.activityLogs);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const [userId, setUserId] = useState("all");
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  const entityTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.entityType))).sort(),
    [logs],
  );
  const users = useMemo(() => {
    const m = new Map<string, string>();
    logs.forEach((l) => m.set(l.userId, l.userName));
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [logs]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return logs.filter((l) => {
      if (entity !== "all" && l.entityType !== entity) return false;
      if (userId !== "all" && l.userId !== userId) return false;
      if (query) {
        const hay = `${l.action} ${l.userName} ${l.entityType} ${JSON.stringify(l.details ?? {})}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [logs, q, entity, userId]);

  const exportCsv = () => {
    downloadCsv(
      `audit-log-${Date.now()}.csv`,
      filtered.map((l) => ({
        date: l.createdAt,
        user: l.userName,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId ?? "",
        details: l.details ? JSON.stringify(l.details) : "",
      })),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock audit log"
        description="Immutable record of every stock-changing action."
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
