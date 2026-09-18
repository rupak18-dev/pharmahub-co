import { CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { Progress } from "@/Components/ui/progress";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { EditProfileButton } from "./EditProfileButton";
import { cn } from "@/lib/utils";

const CHECKLIST = [
  { key: "name", label: "Display name", test: (user, owner) => Boolean(user?.name) },
  { key: "email", label: "Email address", test: (user) => Boolean(user?.email) },
  {
    key: "phone",
    label: "Phone number",
    test: (user, owner) => Boolean(user?.phone || owner?.phone),
  },
  { key: "orgName", label: "Organization name", test: (_u, owner) => Boolean(owner?.orgName) },
  {
    key: "businessType",
    label: "Business type",
    test: (_u, owner) => Boolean(owner?.businessType),
  },
  {
    key: "businessEmail",
    label: "Business email",
    test: (_u, owner) => Boolean(owner?.businessEmail),
  },
  { key: "gstin", label: "GSTIN", test: (_u, owner) => Boolean(owner?.gstin) },
  { key: "licenseNo", label: "Pharmacy license", test: (_u, owner) => Boolean(owner?.licenseNo) },
  { key: "address", label: "Registered address", test: (_u, owner) => Boolean(owner?.address) },
];

export function ProfileOverview() {
  const { user } = useAuth();
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));
  const done = CHECKLIST.filter((item) => item.test(user, owner));
  const pending = CHECKLIST.filter((item) => !item.test(user, owner));
  const percent = Math.round((done.length / CHECKLIST.length) * 100);

  return (
    <ProfileSectionCard
      id="profile-overview"
      icon={CheckCircle2}
      title="Profile Overview"
      description="Pharmacy account & organization profile completion status."
      className="col-span-12"
      footer={
        <>
          <EditProfileButton />
          <span className="text-xs text-muted-foreground">
            {percent === 100
              ? "Your pharmacy profile is complete."
              : "Complete your pharmacy profile to keep store details up to date."}
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="w-full lg:max-w-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-foreground">Profile completion</span>
            <span className="text-sm font-semibold tabular-nums text-primary">{percent}%</span>
          </div>
          <Progress value={percent} className="mt-2 h-2" aria-label="Profile completion" />
        </div>
        <div className="min-w-0 flex-1">
          {pending.length > 0 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Missing information
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {pending.map((item) => (
                  <li
                    key={item.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Circle className="h-3 w-3" aria-hidden="true" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className={cn("h-4 w-4 text-primary")} aria-hidden="true" />
              All profile details are filled in.
            </p>
          )}
        </div>
      </div>
    </ProfileSectionCard>
  );
}
