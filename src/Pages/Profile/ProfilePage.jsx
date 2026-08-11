import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePermission } from "@/hooks/usePermission";
import { useActiveSection } from "@/hooks/useActiveSection";
import { PROFILE_SECTION_IDS } from "@/lib/profileSections";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Edit3, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ProfileCompletionCard } from "./components/ProfileCompletionCard";
import { OrganizationSection } from "@/Pages/Admin/components/OrganizationSection";
import { BusinessSettingsSection } from "@/Pages/Admin/components/BusinessSettingsSection";
import { SecuritySection } from "@/Pages/Admin/components/SecuritySection";
import { AboutPharmaSection } from "@/Pages/Admin/components/AboutPharmaSection";
import { DangerZoneSection } from "@/Pages/Admin/components/DangerZoneSection";
import { PharmaCard } from "@/Pages/Admin/components/PharmaCard";

export const handle = { title: "Profile · PharmaHub" };

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

function ChangePasswordModal({ open, onOpenChange }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const validate = () => {
    const errs = {};
    if (!currentPassword.trim()) errs.currentPassword = "Current password is required";
    if (!newPassword.trim()) errs.newPassword = "New password is required";
    else if (newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword.trim()) errs.confirmPassword = "Please confirm your new password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password updated successfully");
      handleClose();
    } catch (err) {
      setErrors((prev) => ({ ...prev, currentPassword: err.message || "Incorrect current password" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-4 w-4 text-primary" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Current Password */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-current" className="text-xs font-semibold">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="cp-current"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setErrors((p) => ({ ...p, currentPassword: null })); }}
                placeholder="Enter current password"
                className="pr-9 rounded-lg text-xs h-9"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-[11px] text-destructive">{errors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-new" className="text-xs font-semibold">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="cp-new"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: null, confirmPassword: null })); }}
                placeholder="Min. 6 characters"
                className="pr-9 rounded-lg text-xs h-9"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-[11px] text-destructive">{errors.newPassword}</p>}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-confirm" className="text-xs font-semibold">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="cp-confirm"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: null })); }}
                placeholder="Re-enter new password"
                className="pr-9 rounded-lg text-xs h-9"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[11px] text-destructive">{errors.confirmPassword}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" className="h-9 text-xs" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            {saving ? "Updating…" : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const has = usePermission();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const active = useActiveSection(PROFILE_SECTION_IDS);
  const [chromeHeight, setChromeHeight] = useState(144);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector("header");
      const headerH = header?.getBoundingClientRect().height ?? 64;
      const pageHeader = document.querySelector("[data-profile-header]");
      const pageHeaderH = pageHeader?.getBoundingClientRect().height ?? 0;
      setChromeHeight(headerH + pageHeaderH);
    };
    measure();
    const targets = [
      document.querySelector("header"),
      document.querySelector("[data-profile-header]"),
    ];
    const observer = new ResizeObserver(measure);
    targets.forEach((target) => target && observer.observe(target));
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const target = hash ? hash.slice(1) : null;
    if (target && PROFILE_SECTION_IDS.includes(target)) {
      const frame = requestAnimationFrame(() => scrollToSection(target));
      return () => cancelAnimationFrame(frame);
    }
  }, [hash]);

  useEffect(() => {
    const navTarget = hash ? hash.slice(1) : null;
    if (navTarget && active !== navTarget) return;
    window.dispatchEvent(new CustomEvent("pharmahub:profile-section", { detail: active }));
  }, [active, hash]);

  if (!has("admin", "view")) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        You don't have access to Profile.
      </div>
    );
  }

  return (
    <div
      className="w-full [overflow-x:clip] pb-16 pt-2"
      style={{ "--profile-section-min-h": `calc(100svh - ${chromeHeight}px)` }}
    >
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6">
        {/* Page Header */}
        <div data-profile-header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Pharma Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your pharma identity, plan and settings
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              onClick={() => navigate("/profile/edit")}
              className="font-medium gap-2 rounded-lg shadow-xs px-4 py-2 text-xs sm:text-sm h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Completion Reference Card */}
        <ProfileCompletionCard />

        {/* 2-Column Settings Layout: Main Content (8 cols) vs Right Navigation/Summary (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Main Content Sections Column */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <OrganizationSection />
            <BusinessSettingsSection />
            <SecuritySection />
            <AboutPharmaSection />
            <DangerZoneSection />
          </div>

          {/* Right Sticky Settings Navigation & Summary Sidebar */}
          <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-20">
            <PharmaCard />
          </div>
        </div>
      </div>
      <ChangePasswordModal open={showChangePassword} onOpenChange={setShowChangePassword} />
    </div>
  );
}
