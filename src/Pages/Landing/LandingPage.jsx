import { Link } from "react-router";
import {
  Layers,
  CalendarClock,
  Receipt,
  ShieldCheck,
  BarChart3,
  Boxes,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { BrandMark } from "@/Components/shared/BrandMark";
export const handle = { title: "PharmaHub — Modern Pharmacy Management Software" };
const features = [
  {
    icon: Layers,
    title: "Batch tracking with FEFO",
    body: "Every unit is tied to a batch. Sales auto-pick the first-to-expire stock so nothing quietly rots on the shelf.",
  },
  {
    icon: CalendarClock,
    title: "Expiry alerts that actually work",
    body: "Configurable thresholds, an expiry calendar, and one-click return-to-supplier or disposal workflows.",
  },
  {
    icon: Receipt,
    title: "GST-ready POS billing",
    body: "Barcode scan, live GST, multiple tenders, printable invoice. Built for the counter, not a demo reel.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Owner, Admin, Pharmacist, Cashier, Store Keeper, Inventory Manager — each sees only what they should.",
  },
  {
    icon: BarChart3,
    title: "Reports & insights",
    body: "Sales, purchase, stock, expiry and GST reports with CSV/PDF export and clean at-a-glance charts.",
  },
  {
    icon: Boxes,
    title: "Full stock intelligence",
    body: "Live valuation, dead-stock detection, fast/slow movers, and auto reorder alerts per medicine.",
  },
];
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground">
              Workflow
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-accent),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Built for daily pharmacy
              operations
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
              The operating system for <span className="text-primary">modern pharmacies</span>.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              PharmaHub keeps every batch, expiry, and invoice under one roof — so your staff move
              faster, your shelves stay clean, and your books stay accurate.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start free trial <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Set up your pharmacy in minutes — invite your team and assign roles.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <span className="text-xs text-muted-foreground">PharmaHub.app / dashboard</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-6">
              {[
                { l: "Stock value", v: "₹4.82L", tone: "text-primary" },
                { l: "Near expiry", v: "37", tone: "text-warning-foreground" },
                { l: "Low stock", v: "12", tone: "text-warning-foreground" },
                { l: "Today's sales", v: "₹18,420", tone: "text-success" },
              ].map((k) => (
                <div key={k.l} className="rounded-lg border border-border bg-background p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {k.l}
                  </div>
                  <div className={`mt-1 text-xl font-semibold tabular-nums ${k.tone}`}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything a pharmacy actually needs.
            </h2>
            <p className="mt-4 text-muted-foreground">
              No consumer fluff. PharmaHub is designed like real back-office software — dense,
              accurate, and fast.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                From goods received to invoice — one clean thread.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every stock movement is logged. Every batch has a lifecycle. Every user has a role.
                No spreadsheets, no guessing.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Auto-generated batches on GRN with expiry and MRP",
                  "FEFO/FIFO batch pick at the POS",
                  "Automatic near-expiry and reorder alerts",
                  "Full audit trail on every stock change",
                  "Role-based access from Owner to Cashier",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="space-y-3 font-mono text-xs">
                {[
                  { t: "GRN #2041 received", s: "Amoxicillin 250mg · +200 units" },
                  { t: "Batch B1004A activated", s: "Exp 2027-04-12 · MRP ₹85" },
                  { t: "Sale INV-01829", s: "3 items · ₹412.00 · GST ₹44" },
                  { t: "Near-expiry alert", s: "6 batches within 30 days" },
                  { t: "Reorder suggested", s: "Paracetamol 500mg · below 100" },
                ].map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{e.t}</div>
                      <div className="text-muted-foreground">{e.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start free. Scale when you're ready.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Full-featured trial available today. Cloud sync and multi-branch pricing coming next.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Create your account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandMark size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PharmaHub. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
