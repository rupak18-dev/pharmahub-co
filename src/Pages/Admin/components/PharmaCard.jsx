import {
  Building2,
  CalendarDays,
  Edit3,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Separator } from "@/Components/ui/separator";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-xs font-medium text-foreground leading-snug">
          {value || (
            <span className="italic text-muted-foreground font-normal">Not configured</span>
          )}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export function PharmaCard() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // Read from live db so the panel reflects saves immediately
  const liveUser = useDb((d) => d.profiles.find((p) => p.id === authUser?.id));
  const owner = useDb((d) => d.profiles.find((p) => p.role === "Owner"));

  // Prefer live db record; fall back to auth snapshot
  const user = liveUser ?? authUser;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  const initials = (user?.name || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary shadow-xs">
            <UserRound className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Profile</CardTitle>
            <p className="text-xs text-muted-foreground">{owner?.orgName || "Not configured"}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 py-4">
        {/* Avatar + name row */}
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name || (
                <span className="italic text-muted-foreground font-normal">Not configured</span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || "—"}</p>
          </div>
        </div>

        {/* Personal information */}
        <div className="space-y-3">
          <SectionHeading>Personal Information</SectionHeading>
          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow icon={Phone} label="Phone" value={user?.phone} />
            <InfoRow icon={ShieldCheck} label="Role" value={user?.role} />
            {memberSince && (
              <InfoRow icon={CalendarDays} label="Member Since" value={memberSince} />
            )}
          </div>
        </div>

        <Separator />

        {/* Pharmacy details */}
        <div className="space-y-3">
          <SectionHeading>Pharmacy Details</SectionHeading>
          <div className="space-y-3">
            <InfoRow icon={Building2} label="Organization" value={owner?.orgName} />
            <InfoRow icon={Building2} label="Business Type" value={owner?.businessType} />
            <InfoRow icon={Phone} label="Phone" value={owner?.phone} />
            <InfoRow icon={Mail} label="Business Email" value={owner?.businessEmail} />
            <InfoRow icon={Landmark} label="GSTIN" value={owner?.gstin} />
            {owner?.address && <InfoRow icon={MapPin} label="Address" value={owner.address} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
