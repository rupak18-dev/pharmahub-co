import { useState, useMemo } from "react";
import {
  ShieldCheck,
  UserPlus,
  Users,
  Shield,
  Search,
  ChevronRight,
  X,
  Check,
  Eye,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Crown,
  Settings,
  Pill,
  Package,
  ShoppingCart,
  Receipt,
  CalendarClock,
  ClipboardCheck,
  BarChart3,
  Bell,
  Sparkles,
  Cog,
  LayoutDashboard,
  ChevronDown,
  UserCheck,
  UserX,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ALL_ACTIONS, ALL_MODULES, ALL_ROLES } from "@/lib/permissions";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
export const handle = { title: "Users & Roles · PharmaHub" };
// ─── Role meta ────────────────────────────────────────────────────────────────
const ROLE_META = {
  Owner: {
    icon: Crown,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    description: "Full unrestricted access to all modules and settings.",
    modules: ["All Modules"],
  },
  Admin: {
    icon: ShieldCheck,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-200",
    description: "Manage team, roles, and all operational modules.",
    modules: ["Medicines", "Inventory", "Sales", "Reports", "Users"],
  },
  Pharmacist: {
    icon: Pill,
    color: "text-teal-600",
    bg: "bg-teal-50 border-teal-200",
    description: "Handles dispensing, stock review, and sales operations.",
    modules: ["Medicines", "Sales", "Inventory", "Expiry"],
  },
  Cashier: {
    icon: Receipt,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    description: "Processes sales and manages point-of-sale transactions.",
    modules: ["Sales & POS", "Dashboard"],
  },
  "Store Keeper": {
    icon: Package,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    description: "Manages physical inventory, batches, and stock movements.",
    modules: ["Inventory", "Batches", "Expiry", "Audit"],
  },
  "Inventory Manager": {
    icon: Cog,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    description: "Oversees procurement, stock levels, and supplier relations.",
    modules: ["Purchases", "Inventory", "Batches", "Reports"],
  },
};
const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  medicines: Pill,
  batches: Package,
  inventory: Package,
  purchases: ShoppingCart,
  sales: Receipt,
  expiry: CalendarClock,
  audit: ClipboardCheck,
  users: Users,
  reports: BarChart3,
  notifications: Bell,
  ai: Sparkles,
  admin: Settings,
};
const ROLE_BADGE_STYLES = {
  Owner: "bg-amber-100 text-amber-700 border-amber-200",
  Admin: "bg-violet-100 text-violet-700 border-violet-200",
  Pharmacist: "bg-teal-100 text-teal-700 border-teal-200",
  Cashier: "bg-blue-100 text-blue-700 border-blue-200",
  "Store Keeper": "bg-orange-100 text-orange-700 border-orange-200",
  "Inventory Manager": "bg-indigo-100 text-indigo-700 border-indigo-200",
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const has = usePermission();
  if (!has("users", "view")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users & Roles" />
        <EmptyState
          icon={ShieldCheck}
          title="You don't have permission to view this module"
          description="Contact an Owner or Admin to request access."
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage team access and configure permissions per role."
      />
      <Tabs defaultValue="users">
        <TabsList className="h-10 rounded-lg border border-border bg-muted/40 p-1">
          <TabsTrigger
            value="users"
            className="rounded-md px-5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="rounded-md px-5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Shield className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="rounded-md px-5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Settings className="mr-2 h-4 w-4" />
            Access Policy Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <RolesTab />
        </TabsContent>
        <TabsContent value="policy" className="mt-6">
          <PolicyBuilderTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
// ─── TAB 1: USERS ─────────────────────────────────────────────────────────────
function UsersTab() {
  const profiles = useDb((d) => d.profiles);
  const { user } = useAuth();
  const has = usePermission();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const changeRole = (id, next) => {
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) p.role = next;
    });
    toast.success("Role updated");
  };
  const toggleActive = (id) => {
    if (user?.id === id) {
      toast.error("You can't deactivate yourself");
      return;
    }
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) p.active = !p.active;
    });
  };
  const filtered = useMemo(() => {
    let list = [...profiles];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q),
      );
    }
    if (filterRole !== "all") list = list.filter((p) => p.role === filterRole);
    if (filterStatus === "active") list = list.filter((p) => p.active);
    if (filterStatus === "inactive") list = list.filter((p) => !p.active);
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      if (sortBy === "date") return b.createdAt.localeCompare(a.createdAt);
      return 0;
    });
    return list;
  }, [profiles, search, filterRole, filterStatus, sortBy]);
  const totalActive = profiles.filter((p) => p.active).length;
  const totalInactive = profiles.filter((p) => !p.active).length;
  const roles = Array.from(new Set(profiles.map((p) => p.role)));
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiBox
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Team Members"
          value={profiles.length}
          sub="All registered users"
        />
        <KpiBox
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Active Users"
          value={totalActive}
          sub="Currently enabled"
        />
        <KpiBox
          icon={UserX}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          label="Suspended / Inactive"
          value={totalInactive}
          sub="Disabled accounts"
        />
        <KpiBox
          icon={ShieldCheck}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          label="Active Assigned Roles"
          value={roles.length}
          sub="Unique roles in use"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-9 w-36 bg-white">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-36 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-36 bg-white">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="role">Sort by Role</SelectItem>
              <SelectItem value="date">Sort by Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {has("users", "create") && (
          <Button size="sm" className="h-9 gap-2 shrink-0" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Member
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No users match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-muted/20 transition-colors">
                  {/* Avatar + Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <p className="font-medium leading-tight">
                          {p.name}
                          {user?.id === p.id && (
                            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              You
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  {/* Role */}
                  <td className="px-4 py-3">
                    {has("users", "update") ? (
                      <Select
                        value={p.role}
                        onValueChange={(v) => changeRole(p.id, v)}
                        disabled={p.role === "Owner" && user?.id !== p.id}
                      >
                        <SelectTrigger className="h-7 w-44 border-0 bg-transparent p-0 shadow-none text-sm font-medium hover:bg-muted/50 focus:ring-0">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_STYLES[p.role]}`}
                          >
                            {p.role}
                          </span>
                          <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_STYLES[p.role]}`}
                      >
                        {p.role}
                      </span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        Suspended
                      </span>
                    )}
                  </td>
                  {/* Date */}
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(p.createdAt)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {has("users", "update") && user?.id !== p.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleActive(p.id)}
                      >
                        {p.active ? "Suspend" : "Activate"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            Showing {filtered.length} of {profiles.length} users
          </div>
        )}
      </div>

      {/* Invite Wizard */}
      <InviteWizard open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
// ─── KPI Box ──────────────────────────────────────────────────────────────────
function KpiBox({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
// ─── INVITE WIZARD ────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  "Employee Information",
  "Account Setup",
  "Role & Permissions",
  "Module Access",
  "Review & Invite",
];
function InviteWizard({ open, onClose }) {
  const profiles = useDb((d) => d.profiles);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("Cashier");
  const reset = () => {
    setStep(0);
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setDesignation("");
    setRole("Cashier");
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const handleContinue = () => {
    if (step === 0) {
      if (!name.trim() || !email.trim()) {
        toast.error("Full name and work email are required");
        return;
      }
      if (profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase())) {
        toast.error("A user with that email already exists");
        return;
      }
    }
    if (step < WIZARD_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step: submit
      db.set((d) => {
        d.profiles.push({
          id: db.uid(),
          name: name.trim(),
          email: email.trim(),
          role,
          active: true,
          createdAt: new Date().toISOString(),
        });
      });
      toast.success(`${name} has been invited successfully!`);
      handleClose();
    }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Invite Team Member</DialogTitle>
          </DialogHeader>
          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-1">
            {WIZARD_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-medium">{WIZARD_STEPS[step]}</p>
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {WIZARD_STEPS.length}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the employee's basic details to get started.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Full Name *</Label>
                  <Input
                    placeholder="e.g. Ravi Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Work Email *</Label>
                  <Input
                    type="email"
                    placeholder="e.g. ravi@pharma.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Department</Label>
                  <Input
                    placeholder="e.g. Operations"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Designation</Label>
                  <Input
                    placeholder="e.g. Senior Pharmacist"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure login credentials and account settings.
              </p>
              <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(name || "U")}
                  </div>
                  <div>
                    <p className="font-semibold">{name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{email || "—"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Temporary Password</Label>
                <Input
                  type="password"
                  placeholder="Will be auto-generated"
                  readOnly
                  className="bg-muted/30 text-muted-foreground"
                  value="••••••••••"
                />
                <p className="text-[11px] text-muted-foreground">
                  A secure password will be generated and sent to the user's email.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Authentication Method</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {["Email & Password", "Google SSO"].map((m) => (
                    <div
                      key={m}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${m === "Email & Password" ? "border-primary bg-primary/5" : "border-border bg-white"}`}
                    >
                      <div
                        className={`h-3 w-3 rounded-full border-2 ${m === "Email & Password" ? "border-primary bg-primary" : "border-border"}`}
                      />
                      <span className="text-sm">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign a role to define default access permissions.
              </p>
              <div className="grid gap-2">
                {ALL_ROLES.map((r) => {
                  const meta = ROLE_META[r];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                        role === r
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-white hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{r}</p>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                      </div>
                      {role === r && <Check className="h-4 w-4 text-primary mt-1 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Module access is determined by the assigned role. You can customize after inviting.
              </p>
              <div className="grid gap-1.5">
                {ALL_MODULES.map((mod) => {
                  const Icon = MODULE_ICONS[mod.key] ?? Settings;
                  return (
                    <div
                      key={mod.key}
                      className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{mod.label}</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-medium">Inherited</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review the details before sending the invitation.
              </p>
              <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border">
                {[
                  { label: "Full Name", value: name },
                  { label: "Work Email", value: email },
                  { label: "Phone", value: phone || "—" },
                  { label: "Department", value: department || "—" },
                  { label: "Designation", value: designation || "—" },
                  { label: "Role", value: role },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-4 py-2.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                An invitation email will be sent to <strong>{email}</strong> with setup
                instructions.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleContinue} className="gap-1.5">
              {step < WIZARD_STEPS.length - 1 ? (
                <>
                  Continue <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Send Invitation <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// ─── TAB 2: ROLES ─────────────────────────────────────────────────────────────
function RolesTab() {
  const profiles = useDb((d) => d.profiles);
  const perms = useDb((d) => d.permissions);
  const [selectedRole, setSelectedRole] = useState(null);
  const usersPerRole = useMemo(() => {
    const map = {};
    profiles.forEach((p) => {
      map[p.role] = (map[p.role] ?? 0) + 1;
    });
    return map;
  }, [profiles]);
  const permCount = (role) => {
    const rm = perms[role];
    let count = 0;
    Object.values(rm).forEach((actions) => {
      Object.values(actions).forEach((v) => {
        if (v) count++;
      });
    });
    return count;
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Role Definitions</h3>
          <p className="text-xs text-muted-foreground">Configure access policies per role.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((r) => {
          const meta = ROLE_META[r];
          const Icon = meta.icon;
          const userCount = usersPerRole[r] ?? 0;
          const pCount = permCount(r);
          return (
            <div
              key={r}
              className="group relative flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${meta.bg} transition-transform group-hover:scale-105`}
                >
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {pCount} permissions
                </span>
              </div>

              <div className="mt-3 flex-1">
                <h4 className="font-semibold text-foreground">{r}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {meta.description}
                </p>
              </div>

              {/* Users assigned */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {profiles
                    .filter((p) => p.role === r)
                    .slice(0, 4)
                    .map((p) => (
                      <div
                        key={p.id}
                        title={p.name}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-[10px] font-bold text-primary"
                      >
                        {getInitials(p.name)}
                      </div>
                    ))}
                  {userCount === 0 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 text-[10px] text-muted-foreground">
                      —
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {userCount === 0
                    ? "No users assigned"
                    : `${userCount} user${userCount > 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Module scope */}
              <div className="mt-3 flex flex-wrap gap-1">
                {meta.modules.slice(0, 3).map((m) => (
                  <span
                    key={m}
                    className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
                {meta.modules.length > 3 && (
                  <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{meta.modules.length - 3} more
                  </span>
                )}
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => setSelectedRole(r)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <Settings className="h-3.5 w-3.5" />
                Configure Access Policy
              </button>
            </div>
          );
        })}
      </div>

      {/* Policy Modal */}
      {selectedRole && (
        <PolicyModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
          userCount={usersPerRole[selectedRole] ?? 0}
        />
      )}
    </div>
  );
}
// ─── POLICY MODAL ─────────────────────────────────────────────────────────────
function PolicyModal({ role, onClose, userCount }) {
  const perms = useDb((d) => d.permissions);
  const profiles = useDb((d) => d.profiles);
  const has = usePermission();
  const canEdit = has("users", "update") && role !== "Owner";
  const [activeTab, setActiveTab] = useState("builder");
  const [selectedModule, setSelectedModule] = useState("dashboard");
  const [moduleSearch, setModuleSearch] = useState("");
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  const toggle = (mod, action) => {
    if (!canEdit) return;
    db.set((d) => {
      // @ts-expect-error indexing
      d.permissions[role][mod][action] = !d.permissions[role][mod][action];
    });
  };
  const revokeAll = (mod) => {
    if (!canEdit) return;
    db.set((d) => {
      ALL_ACTIONS.forEach((a) => {
        d.permissions[role][mod][a] = false;
      });
    });
    toast.success("All permissions revoked for this module");
  };
  const grantAll = (mod) => {
    if (!canEdit) return;
    db.set((d) => {
      ALL_ACTIONS.forEach((a) => {
        d.permissions[role][mod][a] = true;
      });
    });
    toast.success("Full access granted for this module");
  };
  const filteredModules = moduleSearch
    ? ALL_MODULES.filter((m) => m.label.toLowerCase().includes(moduleSearch.toLowerCase()))
    : ALL_MODULES;
  const currentPerms = perms[role][selectedModule];
  const activePerms = Object.values(currentPerms).filter(Boolean).length;
  const totalPerms = ALL_ACTIONS.length;
  const PERM_GROUPS = [
    {
      label: "General Access",
      actions: ["view", "export"],
    },
    {
      label: "Management",
      actions: ["create", "update", "delete"],
    },
    {
      label: "Advanced Operations",
      actions: ["approve"],
    },
  ];
  const PERM_LABELS = {
    view: { label: "View", desc: "Read-only access to this module", icon: Eye },
    create: { label: "Create", desc: "Add new records", icon: Plus },
    update: { label: "Update", desc: "Edit existing records", icon: Pencil },
    delete: { label: "Delete", desc: "Remove records permanently", icon: Trash2 },
    approve: { label: "Approve Workflow", desc: "Approve pending requests", icon: CheckCircle2 },
    export: { label: "Export", desc: "Download data as CSV/PDF", icon: ArrowUpDown },
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${meta.bg}`}
            >
              <Icon className={`h-5 w-5 ${meta.color}`} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">{role}</DialogTitle>
              <p className="text-xs text-muted-foreground">Access Policy Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold">
              {userCount} {userCount === 1 ? "user" : "users"} assigned
            </span>
            <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-border bg-muted/20 px-6">
          <div className="flex gap-1">
            {[
              { key: "builder", label: "Policy Builder" },
              { key: "preview", label: "Live Access Preview" },
              { key: "assigned", label: "Assigned Users" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {activeTab === "builder" && (
            <>
              {/* Left: Module list */}
              <div className="w-56 shrink-0 border-r border-border flex flex-col">
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search modules..."
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-white"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredModules.map((mod) => {
                    const ModIcon = MODULE_ICONS[mod.key] ?? Settings;
                    const mp = perms[role][mod.key];
                    const active = Object.values(mp).filter(Boolean).length;
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => setSelectedModule(mod.key)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${
                          selectedModule === mod.key
                            ? "bg-primary/8 border-l-2 border-primary text-primary font-medium"
                            : "hover:bg-muted/40 text-foreground border-l-2 border-transparent"
                        }`}
                      >
                        <ModIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{mod.label}</span>
                        <span
                          className={`shrink-0 text-[10px] font-bold ${active > 0 ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {active}/{totalPerms}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Permission editor */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {ALL_MODULES.find((m) => m.key === selectedModule)?.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {activePerms} of {totalPerms} permissions active
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => grantAll(selectedModule)}
                        className="rounded-lg border border-primary bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Full Access
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeAll(selectedModule)}
                        className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors"
                      >
                        Revoke All
                      </button>
                    </div>
                  )}
                </div>

                {/* Module status bar */}
                <div className="mb-4 flex overflow-hidden rounded-full bg-muted h-1.5">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(activePerms / totalPerms) * 100}%` }}
                  />
                </div>

                {PERM_GROUPS.map((group) => (
                  <div key={group.label} className="mb-5">
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.actions.map((action) => {
                        const enabled = currentPerms[action] ?? false;
                        const pMeta = PERM_LABELS[action];
                        const PIcon = pMeta.icon;
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => toggle(selectedModule, action)}
                            disabled={!canEdit}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                              enabled
                                ? "border-primary/30 bg-primary/5 text-foreground"
                                : "border-border bg-white text-muted-foreground"
                            } ${canEdit ? "hover:border-primary/50 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${enabled ? "bg-primary/10" : "bg-muted/50"}`}
                            >
                              <PIcon
                                className={`h-4 w-4 ${enabled ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold ${enabled ? "text-foreground" : "text-muted-foreground"}`}
                              >
                                {pMeta.label}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {pMeta.desc}
                              </p>
                            </div>
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                enabled
                                  ? "border-primary bg-primary"
                                  : "border-border bg-transparent"
                              }`}
                            >
                              {enabled && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {role === "Owner" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Owner has all permissions and they cannot be modified.
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "preview" && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <h4 className="font-semibold">Live Access Preview</h4>
                <p className="text-xs text-muted-foreground">
                  A summary of all active permissions for the {role} role.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Module
                      </th>
                      {ALL_ACTIONS.map((a) => (
                        <th
                          key={a}
                          className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize"
                        >
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ALL_MODULES.map((mod) => (
                      <tr key={mod.key} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{mod.label}</td>
                        {ALL_ACTIONS.map((a) => (
                          <td key={a} className="px-2 py-2.5 text-center">
                            {perms[role][mod.key][a] ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="mx-auto h-4 w-4 text-muted-foreground/30" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "assigned" && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <h4 className="font-semibold">Assigned Users</h4>
                <p className="text-xs text-muted-foreground">
                  {userCount} {userCount === 1 ? "user" : "users"} assigned to {role}.
                </p>
              </div>
              {profiles.filter((p) => p.role === role).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No users assigned to this role</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles
                    .filter((p) => p.role === role)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(p.name)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${p.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
                        >
                          {p.active ? "Active" : "Suspended"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border px-6 py-4">
          <Button size="sm" onClick={onClose}>
            Done & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// ─── TAB 3: ACCESS POLICY BUILDER ─────────────────────────────────────────────
function PolicyBuilderTab() {
  const perms = useDb((d) => d.permissions);
  const has = usePermission();
  const canEdit = has("users", "update");
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [selectedModule, setSelectedModule] = useState("dashboard");
  const [moduleSearch, setModuleSearch] = useState("");
  const toggle = (action) => {
    if (!canEdit || selectedRole === "Owner") return;
    const pa = action;
    db.set((d) => {
      d.permissions[selectedRole][selectedModule][pa] =
        !d.permissions[selectedRole][selectedModule][pa];
    });
  };
  const grantAll = () => {
    if (!canEdit || selectedRole === "Owner") return;
    db.set((d) => {
      ALL_ACTIONS.forEach((a) => {
        d.permissions[selectedRole][selectedModule][a] = true;
      });
    });
    toast.success("Full access granted");
  };
  const revokeAll = () => {
    if (!canEdit || selectedRole === "Owner") return;
    db.set((d) => {
      ALL_ACTIONS.forEach((a) => {
        d.permissions[selectedRole][selectedModule][a] = false;
      });
    });
    toast.success("All permissions revoked");
  };
  const filteredModules = moduleSearch
    ? ALL_MODULES.filter((m) => m.label.toLowerCase().includes(moduleSearch.toLowerCase()))
    : ALL_MODULES;
  const currentPerms = perms[selectedRole][selectedModule];
  const activePerms = Object.values(currentPerms).filter(Boolean).length;
  const totalPerms = ALL_ACTIONS.length;
  const isFullAccess = activePerms === totalPerms;
  const isNoAccess = activePerms === 0;
  const PERM_LABELS = {
    view: "View",
    create: "Create",
    update: "Update",
    approve: "Approve Workflow",
    export: "Export",
    delete: "Delete",
  };
  const rolesMeta = ROLE_META[selectedRole];
  const RoleIcon = rolesMeta.icon;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Access Policy Builder</h3>
          <p className="text-xs text-muted-foreground">
            Fine-tune permissions per role and module.
          </p>
        </div>
        {/* Role selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Editing Role:</span>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v)}>
            <SelectTrigger className="h-9 w-48 bg-white">
              <div className="flex items-center gap-2">
                <RoleIcon className={`h-3.5 w-3.5 ${rolesMeta.color}`} />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => {
                const m = ROLE_META[r];
                const RI = m.icon;
                return (
                  <SelectItem key={r} value={r}>
                    <div className="flex items-center gap-2">
                      <RI className={`h-3.5 w-3.5 ${m.color}`} />
                      {r}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedRole === "Owner" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Owner has all permissions by default and they cannot be edited.
        </div>
      )}

      <div className="flex overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {/* Left: Module navigation */}
        <div className="w-60 shrink-0 border-r border-border flex flex-col">
          <div className="border-b border-border px-3 py-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/20 border-border"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="py-1">
              {filteredModules.map((mod) => {
                const ModIcon = MODULE_ICONS[mod.key] ?? Settings;
                const mp = perms[selectedRole][mod.key];
                const active = Object.values(mp).filter(Boolean).length;
                const isSelected = selectedModule === mod.key;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => setSelectedModule(mod.key)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/8 border-l-2 border-primary"
                        : "hover:bg-muted/30 border-l-2 border-transparent"
                    }`}
                  >
                    <ModIcon
                      className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`flex-1 truncate text-sm ${isSelected ? "font-semibold text-primary" : "text-foreground"}`}
                    >
                      {mod.label}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${i < active ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Permission editor */}
        <div className="flex-1 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {(() => {
                  const ModIcon = MODULE_ICONS[selectedModule] ?? Settings;
                  return <ModIcon className="h-4 w-4 text-muted-foreground" />;
                })()}
                <h4 className="font-semibold">
                  {ALL_MODULES.find((m) => m.key === selectedModule)?.label}
                </h4>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                    isFullAccess
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isNoAccess
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {isFullAccess
                    ? "Full Access"
                    : isNoAccess
                      ? "No Access"
                      : `${activePerms}/${totalPerms}`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Permission count: {activePerms} of {totalPerms} active
              </p>
            </div>
            {canEdit && selectedRole !== "Owner" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={grantAll}
                  className="rounded-lg border border-primary bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Full Access
                </button>
                <button
                  type="button"
                  onClick={revokeAll}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors"
                >
                  Revoke All
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(activePerms / totalPerms) * 100}%` }}
            />
          </div>

          {/* Permission buttons */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_ACTIONS.map((action) => {
              const enabled = currentPerms[action] ?? false;
              const label = PERM_LABELS[action] ?? action;
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => toggle(action)}
                  disabled={!canEdit || selectedRole === "Owner"}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    enabled
                      ? "border-primary/40 bg-primary/8 shadow-sm"
                      : "border-border bg-muted/20 text-muted-foreground"
                  } ${canEdit && selectedRole !== "Owner" ? "hover:border-primary/60 cursor-pointer hover:shadow-sm" : "cursor-not-allowed opacity-60"}`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      enabled
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 bg-transparent"
                    }`}
                  >
                    {enabled && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span
                    className={`text-sm font-semibold ${enabled ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Role summary */}
          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Full Permission Matrix — {selectedRole}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="pb-2 pr-3 text-left font-semibold text-muted-foreground">
                      Module
                    </th>
                    {ALL_ACTIONS.map((a) => (
                      <th
                        key={a}
                        className="pb-2 px-2 text-center capitalize font-semibold text-muted-foreground"
                      >
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ALL_MODULES.map((mod) => (
                    <tr
                      key={mod.key}
                      className={`${selectedModule === mod.key ? "bg-primary/5" : "hover:bg-muted/30"} cursor-pointer`}
                      onClick={() => setSelectedModule(mod.key)}
                    >
                      <td className="py-1.5 pr-3 font-medium">{mod.label}</td>
                      {ALL_ACTIONS.map((a) => (
                        <td key={a} className="py-1.5 px-2 text-center">
                          {perms[selectedRole][mod.key][a] ? (
                            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                          ) : (
                            <span className="inline-block h-2 w-2 rounded-full bg-muted" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
