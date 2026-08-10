import { useNavigate } from "react-router";
import { ChevronsUpDown, LogOut, Settings, User as UserIcon, Repeat, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
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
import { useSidebar } from "@/Components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { ALL_ROLES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
const BRANCHES = [
  { id: "main", name: "Main Branch (HQ)" },
  { id: "downtown", name: "Downtown Pharmacy" },
  { id: "westside", name: "Westside Clinic" },
];

export function SidebarProfile() {
  const { user, signOut, switchRole } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [activeBranch, setActiveBranch] = useState(() => {
    return localStorage.getItem("PharmaHub_branch") || "main";
  });
  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const handleBranchChange = (branchId) => {
    setActiveBranch(branchId);
    localStorage.setItem("PharmaHub_branch", branchId);
    const branchName = BRANCHES.find((b) => b.id === branchId)?.name;
    toast.success(`Switched branch to ${branchName}`);
  };
  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={user.name}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 text-left transition-colors hover:bg-sidebar-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed ? "justify-center p-0" : "justify-between p-2",
          )}
        >
          <div className={cn("min-w-0 flex-col", collapsed ? "hidden" : "flex")}>
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                "shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/40 p-0.5",
                collapsed ? "h-8 w-8" : "h-9 w-9",
              )}
            >
              <Avatar className="h-full w-full">
                <AvatarFallback className="bg-white text-xs font-semibold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            {!collapsed && (
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <span className="mt-1.5 inline-flex w-fit items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {user.role}
            </span>
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
        <DropdownMenuItem onClick={() => navigate("/users")}>
          <UserIcon className="mr-2 h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4 text-destructive" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
