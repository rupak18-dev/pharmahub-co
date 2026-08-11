import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePermission } from "@/hooks/usePermission";
import { useActiveSection } from "@/hooks/useActiveSection";
import { PROFILE_SECTION_IDS } from "@/lib/profileSections";
import { Button } from "@/Components/ui/button";
import { Edit3, UserPlus } from "lucide-react";
import { openInviteStaff } from "@/Components/shared/InviteStaffDrawer";
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

export default function ProfilePage() {
  const has = usePermission();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const active = useActiveSection(PROFILE_SECTION_IDS);
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
              Studio Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your studio identity, plan and settings
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              size="sm"
              onClick={openInviteStaff}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 rounded-lg shadow-xs px-4 py-2 text-xs sm:text-sm h-9"
            >
              <UserPlus className="h-4 w-4" />
              Invite Staff
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile/edit")}
              className="font-medium gap-2 rounded-lg shadow-xs px-4 py-2 text-xs sm:text-sm h-9"
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
    </div>
  );
}
