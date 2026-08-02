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

export const Route = createFileRoute("/_authenticated/dashboard/medicines/categories")({
  head: () => ({ meta: [{ title: "Categories · PharmaHub" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const cats = useDb((d) => d.categories);
  const meds = useDb((d) => d.medicines);
  const has = usePermission();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    if (editingId) {
      db.set((d) => {
        const c = d.categories.find((x) => x.id === editingId);
        if (c) c.name = name.trim();
      });
      toast.success("Category updated");
    } else {
      db.set((d) => {
        d.categories.push({ id: db.uid(), name: name.trim() });
      });
      toast.success("Category added");
    }
    setName("");
    setEditingId(null);
    setOpen(false);
  };

  const remove = (id: string) => {
    const inUse = meds.some((m) => m.categoryId === id);
    if (inUse) {
      toast.error("Category is in use by one or more medicines");
      return;
    }
    db.set((d) => {
      d.categories = d.categories.filter((c) => c.id !== id);
    });
    toast.success("Category removed");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Group medicines for filtering and reporting."
        actions={
          has("medicines", "create") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setName(""); setEditingId(null); }}>
                  <Plus className="mr-1 h-4 w-4" /> New category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Rename category" : "New category"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    autoFocus
                  />
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

      {cats.length === 0 ? (
        <EmptyState title="No categories yet" description="Add your first category to organize the catalog." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium text-right">Medicines</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {meds.filter((m) => m.categoryId === c.id).length}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {has("medicines", "update") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(c.id);
                            setName(c.name);
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
                          onClick={() => remove(c.id)}
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
