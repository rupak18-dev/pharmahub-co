import { useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Checkbox } from "@/Components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { AUDIT_TYPES, AUDIT_TYPE_LABEL, buildAuditScope } from "@/lib/audit";
export function CreateAuditSheet({
  open,
  onOpenChange,
  batches,
  medicines,
  categories,
  profiles,
  branches,
  onSubmit,
}) {
  const [type, setType] = useState("full");
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState(branches[0]);
  const [categoryId, setCategoryId] = useState("none");
  const [shelf, setShelf] = useState("none");
  const [batchIds, setBatchIds] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const reset = () => {
    setType("full");
    setTitle("");
    setBranch(branches[0]);
    setCategoryId("none");
    setShelf("none");
    setBatchIds([]);
    setAssigned([]);
    setScheduledDate(new Date().toISOString().slice(0, 10));
    setNotes("");
  };
  const shelves = useMemo(
    () =>
      Array.from(new Set(batches.map((b) => b.shelfLocation ?? "").filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [batches],
  );
  const branchBatches = useMemo(
    () => batches.filter((b) => (b.branch ?? branches[0]) === branch && b.currentStock > 0),
    [batches, branch, branches],
  );
  const scopePreview = useMemo(
    () =>
      buildAuditScope({
        type,
        batches,
        medicines,
        branch,
        categoryId: categoryId === "none" ? undefined : categoryId,
        shelf: shelf === "none" ? undefined : shelf,
        batchIds,
      }).length,
    [type, batches, medicines, branch, categoryId, shelf, batchIds],
  );
  const submit = () => {
    if (!assigned.length) {
      toast.error("Assign at least one staff member");
      return;
    }
    if (!scheduledDate) {
      toast.error("Choose a scheduled date");
      return;
    }
    if (scopePreview === 0) {
      toast.error("Scope matches no batches — widen the selection");
      return;
    }
    onSubmit({
      type,
      title,
      branch,
      categoryId: categoryId === "none" ? undefined : categoryId,
      shelf: shelf === "none" ? undefined : shelf,
      batchIds,
      assignedUserIds: assigned,
      scheduledDate,
      notes: notes.trim() || undefined,
    });
    reset();
  };
  const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="flex w-full max-w-full sm:max-w-xl flex-col overflow-y-auto p-4 sm:p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base font-bold">
            <ClipboardCheck className="h-4.5 w-4.5 text-primary" /> Schedule new audit
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Audit type *</Label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger className="min-h-[44px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {AUDIT_TYPES.find((t) => t.value === type)?.hint}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-title" className="text-xs font-semibold">
              Title
            </Label>
            <Input
              id="audit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${branch} · ${AUDIT_TYPE_LABEL[type]}`}
              className="min-h-[44px] text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Branch *</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="min-h-[44px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "category" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="min-h-[44px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "shelf" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Shelf *</Label>
              <Select value={shelf} onValueChange={setShelf}>
                <SelectTrigger className="min-h-[44px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shelves.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "batch" && (
            <div className="space-y-2">
              <Label>Batches * ({branchBatches.length} in branch)</Label>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {branchBatches.map((b) => {
                  const med = medicines.find((m) => m.id === b.medicineId);
                  return (
                    <label
                      key={b.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                    >
                      <Checkbox
                        checked={batchIds.includes(b.id)}
                        onCheckedChange={() => setBatchIds((s) => toggle(s, b.id))}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{med?.name ?? "—"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {b.batchNumber} · {b.currentStock} in stock · {b.shelfLocation}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" /> Assign staff *
            </Label>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {profiles
                .filter((p) => p.active)
                .map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={assigned.includes(p.id)}
                      onCheckedChange={() => setAssigned((s) => toggle(s, p.id))}
                    />
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{p.role}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Scheduled date *
            </Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-notes">Notes</Label>
            <Textarea
              id="audit-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional instructions for the counting team…"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">{scopePreview}</span>{" "}
            <span className="text-muted-foreground">batches in scope for this audit</span>
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 bg-card border-t border-border p-3.5 -mx-4 -mb-4 sm:mx-0 sm:mb-0 sm:p-0 sm:border-0 sm:bg-transparent flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[48px] sm:min-h-[36px]"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 min-h-[48px] sm:min-h-[36px] font-bold"
            onClick={submit}
          >
            Schedule Audit
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
