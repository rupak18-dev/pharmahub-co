import { useEffect, useState } from "react";
import { Info, Plus } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { ROLE_CATEGORIES } from "@/lib/roleCatalog";

export const CUSTOM_ROLES_ENABLED = false;

export function CreateCustomRoleDialog({ open, onOpenChange }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(ROLE_CATEGORIES[0].key);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setCategory(ROLE_CATEGORIES[0].key);
    setSubmitted(false);
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Create Custom Role
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Custom roles are not yet available. This form is ready to connect to role provisioning
              once the backend supports it. No changes are saved yet.
            </span>
          </div>

          {submitted ? (
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Role provisioning is not connected</p>
              <p className="mt-1 text-xs">
                The <strong>{name}</strong> role definition has not been saved. A backend connection
                is required to create custom roles.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Night Shift Pharmacist"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this role is responsible for"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {submitted ? (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
                Continue
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
