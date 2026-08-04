import { useNavigate } from "react-router";
import { LogOut, User as UserIcon, Repeat, Store } from "lucide-react";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
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
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-[11px] text-muted-foreground">{user.role}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Repeat className="mr-2 h-4 w-4" /> Switch role (demo)
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {ALL_ROLES.map((r) => (
              <DropdownMenuItem key={r} onClick={() => switchRole(r)}>
                <UserIcon className="mr-2 h-4 w-4" /> {r}
                {r === user.role && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Store className="mr-2 h-4 w-4" /> Switch branch
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {BRANCHES.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => handleBranchChange(b.id)}>
                <Store className="mr-2 h-4 w-4" /> {b.name}
                {b.id === activeBranch && <span className="ml-auto text-xs">✓</span>}
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
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
