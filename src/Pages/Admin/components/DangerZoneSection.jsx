import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { ProfileSectionCard } from "./ProfileSectionCard";

export function DangerZoneSection() {
  const [open, setOpen] = useState(false);

  const handleConfirmDelete = () => {
    toast.error(
      "Account deletion requires primary organization Owner authorization. Contact support@pharmahub.example for account termination requests.",
    );
    setOpen(false);
  };

  return (
    <ProfileSectionCard
      id="danger-zone"
      icon={AlertTriangle}
      title="Danger Zone"
      description="Irreversible actions for your account."
      className="w-full border-destructive/30"
    >
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            Delete this account
          </h4>
          <p className="text-xs text-muted-foreground max-w-md">
            Permanently remove your pharmacy account and associated profile data. This action cannot
            be undone.
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="h-9 text-xs font-semibold shrink-0"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Account
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to request permanent account deletion? All associated pharmacy
              records and profiles will be irreversibly flagged for removal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={handleConfirmDelete}
            >
              Confirm Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileSectionCard>
  );
}
