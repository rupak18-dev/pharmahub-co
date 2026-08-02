import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { usePermission } from "@/hooks/usePermission";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard/medicines/manufacturers")({
  head: () => ({ meta: [{ title: "Manufacturers Â· PharmaHub" }] }),
  component: ManufacturersPage,
});

function ManufacturersPage() {
  const mfrs = useDb((d) => d.manufacturers);
  const meds = useDb((d) => d.medicines);
  const has = usePermission();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    if (editingId) {
      db.set((d) => {
        const m = d.manufacturers.find((x) => x.id === editingId);
        if (m) {
          m.name = name.trim();
          m.contactInfo = contact.trim() || undefined;
        }
      });
      toast.success("Manufacturer updated");
    } else {
      db.set((d) => {
        d.manufacturers.push({
          id: db.uid(),
          name: name.trim(),
          contactInfo: contact.trim() || undefined,
        });
      });
      toast.success("Manufacturer added");
    }
    setName("");
    setContact("");
    setEditingId(null);
    setOpen(false);
  };

  const remove = (id: string) => {
    if (meds.some((m) => m.manufacturerId === id)) {
      toast.error("Manufacturer is in use by one or more medicines");
      return;
    }
    db.set((d) => {
      d.manufacturers = d.manufacturers.filter((x) => x.id !== id);
    });
    toast.success("Manufacturer removed");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturers"
        description="Companies producing the medicines in your catalog."
        actions={
          has("medicines", "create") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setName("");
                    setContact("");
                    setEditingId(null);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" /> New manufacturer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit manufacturer" : "New manufacturer"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mfr-name">Name</Label>
                    <Input
                      id="mfr-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mfr-contact">Contact info</Label>
                    <Input
                      id="mfr-contact"
                      placeholder="Email, phone, or address"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submit}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {mfrs.length === 0 ? (
        <EmptyState title="No manufacturers yet" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Contact</th>
                <th className="px-4 py-2.5 font-medium text-right">Medicines</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mfrs.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.contactInfo || "â€”"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {meds.filter((x) => x.manufacturerId === m.id).length}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {has("medicines", "update") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(m.id);
                            setName(m.name);
                            setContact(m.contactInfo ?? "");
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {has("medicines", "delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => remove(m.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
