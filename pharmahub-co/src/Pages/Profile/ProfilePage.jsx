import { useEffect, useState } from "react";

import { AlertCircle, Edit3, RefreshCw } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useActiveSection } from "@/hooks/useActiveSection";
import { PROFILE_SECTION_IDS, PROFILE_STAFF_SECTION_IDS } from "@/lib/profileSections";
import { Button } from "@/Components/ui/button";
import { useAuth } from "@/lib/auth";
import { ProfileCompletionCard } from "./components/ProfileCompletionCard";
import { AccountSection } from "@/Pages/Admin/components/AccountSection";
import { OrganizationSection } from "@/Pages/Admin/components/OrganizationSection";
import { BusinessSettingsSection } from "@/Pages/Admin/components/BusinessSettingsSection";
import { SecuritySection } from "@/Pages/Admin/components/SecuritySection";
import { PharmaCard } from "@/Pages/Admin/components/PharmaCard";

export const handle = { title: "Profile · PharmaHub" };

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

function ProfileSkeleton() {
  return (
    <div className="w-full pb-16 pt-2">
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-72 animate-pulse rounded-xl bg-muted lg:col-span-8" />
          <div className="h-72 animate-pulse rounded-xl bg-muted lg:col-span-4" />
        </div>
      </div>
    </div>
  );
}

function ProfileError({ onRetry }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Your profile could not be loaded.</p>
      <Button
        type="button"
        size="sm"
        onClick={onRetry}
        className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  const has = usePermission();
  const hash = window.location.hash;
  const { user, loading } = useAuth();
  const isAdmin = has("admin", "view");
  const sectionIds = isAdmin ? PROFILE_SECTION_IDS : PROFILE_STAFF_SECTION_IDS;
  const active = useActiveSection(sectionIds);
  const [chromeHeight, setChromeHeight] = useState(144);

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
    const target = hash || null;
    if (target && sectionIds.includes(target)) {
      const frame = requestAnimationFrame(() => scrollToSection(target));
      return () => cancelAnimationFrame(frame);
    }
  }, [hash, sectionIds]);

  useEffect(() => {
    const navTarget = hash || null;
    if (navTarget && active !== navTarget) return;
    window.dispatchEvent(new CustomEvent("pharmahub:profile-section", { detail: active }));
  }, [active, hash]);

  if (loading) return <ProfileSkeleton />;

  if (!user) return <ProfileError onRetry={() => window.location.reload()} />;

  return (
    <div
      className="w-full [overflow-x:clip] pb-16 pt-2"
      style={{ "--profile-section-min-h": `calc(100svh - ${chromeHeight}px)` }}
    >
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6">
        {/* Page Header */}
        <div
          data-profile-header
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5"
        >
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
              onClick={() => {
                window.location.href = "/profile/edit";
              }}
              className="font-medium gap-2 rounded-lg shadow-xs px-4 py-2 text-xs sm:text-sm h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        {isAdmin ? (
          <>
            {/* Profile Completion Reference Card */}
            <ProfileCompletionCard profile={user} />

            {/* 2-Column Settings Layout: Main Content (8 cols) vs Right Navigation/Summary (4 cols) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* Main Content Sections Column */}
              <div className="flex flex-col gap-6 lg:col-span-8">
                <OrganizationSection />
                <BusinessSettingsSection />
                <SecuritySection />
              </div>

              {/* Right Sticky Settings Navigation & Summary Sidebar */}
              <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-20">
                <PharmaCard />
              </div>
            </div>
          </>
        ) : (
          /* Staff see only their own account details and security — no
             organization/business management and no completion score. */
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <AccountSection />
            <SecuritySection />
          </div>
        )}
      </div>
    </div>
  );
}
