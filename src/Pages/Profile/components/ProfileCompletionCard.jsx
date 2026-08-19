import { useNavigate } from "react-router";
import { Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { useDb } from "@/hooks/useDb";
import { calculateProfileCompletion } from "@/lib/profileCompletion";

export function ProfileCompletionCard({ profile, onSelectField }) {
  const navigate = useNavigate();
  const liveProfile = useDb((d) => d.profiles.find((p) => p.id === profile?.id)) ?? profile;
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));
  const completion = calculateProfileCompletion(liveProfile, owner);
  const { percentage, missingFields, missingSpecs, isComplete } = completion;

  const maxPills = 5;
  const visibleMissing = missingSpecs.slice(0, maxPills);
  const remainingCount = missingSpecs.length - maxPills;

  const handleCompleteProfileClick = () => {
    navigate({ to: "/profile/edit" });
  };

  const handlePillClick = (section) => {
    if (onSelectField) {
      onSelectField(section);
    } else {
      navigate({ to: "/profile/edit", hash: section });
    }
  };

  return (
    <div className="w-full rounded-xl border border-border bg-card p-6 shadow-xs">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Profile Completion</h3>
        </div>

        <span className="text-sm font-bold text-primary">
          {percentage}% Complete
        </span>
      </div>

      {/* Subtle Divider */}
      <div className="my-4 h-[1px] w-full bg-border/60" />

      {/* Horizontal Progress Bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(percentage, 3)}%` }}
        />
      </div>

      {/* Description */}
      <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        Complete your profile to unlock all pharma features and improve your business profile.
      </p>

      {/* Missing Pills & Complete Profile Action */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-1.5">
          {!isComplete && missingFields.length > 0 ? (
            <>
              <span className="text-xs font-semibold text-muted-foreground mr-1">Missing:</span>
              {visibleMissing.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => handlePillClick(field.section)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {field.label}
                </button>
              ))}

              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/profile/edit" })}
                  className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  +{remainingCount} more
                </button>
              )}
            </>
          ) : (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> All profile information complete!
            </span>
          )}
        </div>

        <Button
          onClick={handleCompleteProfileClick}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm h-9 shadow-xs"
        >
          Complete Profile
        </Button>
      </div>
    </div>
  );
}
