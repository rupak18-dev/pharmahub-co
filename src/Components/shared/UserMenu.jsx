import { useNavigate } from "react-router";
import {
  Edit3,
  LogOut,
  Repeat,
  Store,
  User as UserIcon,
  UserPlus,
  UserRound,
} from "lucide-react";
import { openInviteStaff } from "@/Components/shared/InviteStaffDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { ALL_ROLES } from "@/lib/permissions";

const BRANCHES = [
  { id: "main", name: "Main Branch (HQ)" },
  { id: "downtown", name: "Downtown Pharmacy" },
  { id: "westside", name: "Westside Clinic" },
];

export function UserMenu() {
  const { user, signOut, switchRole } = useAuth();
  const navigate = useNavigate();

  const [activeBranch, setActiveBranch] = useState(() => {
    return localStorage.getItem("PharmaHub_branch") || "main";
  });

  const handleBranchChange = (branchId) => {
    setActiveBranch(branchId);
    localStorage.setItem("PharmaHub_branch", branchId);
    const branchName = BRANCHES.find((b) => b.id === branchId)?.name;
    toast.success(`Switched branch to ${branchName}`);
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2 rounded-xl">
          <Avatar className="h-7 w-7">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="hidden sm:flex flex-col items-start leading-tight text-left">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {user.role}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="cursor-pointer font-medium"
        >
          <UserRound className="mr-2 h-4 w-4 text-primary" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/profile/edit")}
          className="cursor-pointer"
        >
          <Edit3 className="mr-2 h-4 w-4 text-primary" />
          Edit Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => openInviteStaff()}
          className="cursor-pointer font-medium"
        >
          <UserPlus className="mr-2 h-4 w-4 text-primary" />
          Invite Staff
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Repeat className="mr-2 h-4 w-4" />
            Switch role (demo)
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="rounded-xl">
            {ALL_ROLES.map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() => switchRole(r)}
                className="cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                {r}
                {r === user.role && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Store className="mr-2 h-4 w-4" />
            Switch branch
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="rounded-xl">
            {BRANCHES.map((b) => (
              <DropdownMenuItem
                key={b.id}
                onClick={() => handleBranchChange(b.id)}
                className="cursor-pointer"
              >
                <Store className="mr-2 h-4 w-4" />
                {b.name}
                {b.id === activeBranch && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            signOut();
            navigate("/login");
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
