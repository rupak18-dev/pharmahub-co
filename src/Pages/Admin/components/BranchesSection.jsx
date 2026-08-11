import { MapPin, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { Button } from "@/Components/ui/button";
import { ProfileSectionCard } from "./ProfileSectionCard";

export function BranchesSection() {
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));

  const addLocation = () => {
    toast.info("Location management will be available once the branches backend is connected.");
  };

  return (
    <ProfileSectionCard
      id="branches-locations"
      icon={Store}
      title="Branches & Locations"
      description="Manage your pharmacy store locations."
      className="col-span-12 md:col-span-6 lg:col-span-5"
      footer={
        <>
          <Button size="sm" variant="outline" className="h-9 text-xs" onClick={addLocation}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Location
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground/70">
          <Store className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Primary Pharmacy</p>
          <p className="truncate text-sm font-medium text-foreground">
            {owner?.orgName || <span className="text-muted-foreground">Not configured</span>}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card/40 px-6 py-8 text-center">
        <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No additional locations configured yet.</p>
      </div>
    </ProfileSectionCard>
  );
}
