import { CalendarDays, Camera, Mail, Phone, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { ProfileSectionCard } from "./ProfileSectionCard";

export function AccountSection() {
  const { user } = useAuth();
  const initials = (user?.name || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;
  const photoPlaceholder = () => {
    toast.info("Profile photo upload will be available once the account backend is connected.");
  };

  return (
    <ProfileSectionCard
      id="account"
      icon={UserRound}
      title="Account"
      description="Manage your personal account information."
      className="w-full"
      footer={
        <span className="text-xs text-muted-foreground">
          Your role and permissions are managed by the organization.
        </span>
      }
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user?.name ?? "Profile"} />}
            <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Change profile picture"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-muted text-muted-foreground shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Change profile picture</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={photoPlaceholder}>
                <Upload className="mr-2 h-4 w-4" /> Upload photo
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={photoPlaceholder}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove photo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{user?.name ?? "—"}</h3>
            <Badge variant="secondary">{user?.role ?? "—"}</Badge>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {user?.email ?? "—"}
          </p>
          {user?.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {user.phone}
            </p>
          )}
          {memberSince && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Member since {memberSince}
            </p>
          )}
        </div>
      </div>
    </ProfileSectionCard>
  );
}
