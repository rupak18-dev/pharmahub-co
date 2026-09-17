import { Info, Pill, QrCode, ShieldAlert, Sparkles, Target, Users2, Zap } from "lucide-react";
import { ProfileSectionCard } from "./ProfileSectionCard";

export function AboutPharmaSection() {
  return (
    <ProfileSectionCard
      id="about-pharma"
      icon={Info}
      title="About Pharma"
      description="Modern inventory & store management platform for pharmacies and distributors."
      className="w-full"
    >
      <div className="space-y-6 text-sm">
        {/* Intro */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-[#007A87]" /> Hey, welcome!
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            We're building a modern inventory management platform for pharmacies and medicine
            distributors — replacing outdated, desktop-locked software with something fast,
            mobile-friendly, and built for how people actually work today.
          </p>
        </div>

        {/* The Problem */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            The problem we're solving
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Most pharmacy and distributor software today (like Marg, Pharmasoft, Essel) is
            old-school — tied to one computer, slow to use, and doesn't warn you before stock
            expires. Staff waste hours manually entering the same data again and again, and
            businesses lose money on expired stock that nobody caught in time.
          </p>
        </div>

        {/* What We're Building Instead */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#007A87]" />
            What we're building instead
          </h4>
          <ul className="grid gap-2.5 sm:grid-cols-2 text-xs text-foreground">
            <li className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 shadow-xs">
              <QrCode className="h-4 w-4 shrink-0 text-[#007A87]" />
              <span>
                <strong>QR-based scanning</strong> instead of manual entry
              </span>
            </li>
            <li className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 shadow-xs">
              <Sparkles className="h-4 w-4 shrink-0 text-[#007A87]" />
              <span>
                <strong>Live dashboard</strong> showing stock, alerts, and activity
              </span>
            </li>
            <li className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 shadow-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 text-[#007A87]" />
              <span>
                <strong>Expiry tracking</strong> + smart notifications
              </span>
            </li>
            <li className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 shadow-xs">
              <Zap className="h-4 w-4 shrink-0 text-[#007A87]" />
              <span>
                <strong>One-click export</strong> to Excel / PDF / Doc
              </span>
            </li>
            <li className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 shadow-xs">
              <Users2 className="h-4 w-4 shrink-0 text-[#007A87]" />
              <span>
                <strong>Role-based access</strong> for owners, managers, and staff
              </span>
            </li>
            <li className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 shadow-xs">
              <Target className="h-4 w-4 shrink-0 text-[#007A87]" />
              <span>
                <strong>Bulk upload</strong> — add hundreds of products in one go
              </span>
            </li>
          </ul>
        </div>

        {/* Who It's For */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users2 className="h-4 w-4 text-[#007A87]" />
            Who it's for
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground pl-1">
            <li className="flex items-start gap-2">
              <span className="text-[#007A87] font-bold">▸</span>
              <span>
                <strong>Individual pharmacies</strong> looking to modernize daily operations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#007A87] font-bold">▸</span>
              <span>
                <strong>Distributors</strong> managing large-scale stock and client orders
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#007A87] font-bold">▸</span>
              <span>
                <strong>(Down the line) Pharmacy chains</strong> needing multi-branch visibility
              </span>
            </li>
          </ul>
        </div>

        {/* Our Mission */}
        <div className="rounded-xl border border-[#007A87]/30 bg-[#007A87]/5 p-4 space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#007A87]">
            Our Mission
          </h4>
          <p className="text-xs leading-relaxed text-foreground">
            Make pharmacy inventory management as simple as checking your phone — no more outdated
            software, no more losses from missed expiry dates, and no more being stuck at one desk.
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            Glad to have you here — feel free to explore, ask questions, and follow along as we
            build this.
          </p>
        </div>
      </div>
    </ProfileSectionCard>
  );
}
