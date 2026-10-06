import { useEffect, useState } from "react";
import { Building2, Info, Plug, Settings, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const PROFILE_SECTIONS = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "business-settings", label: "Business Settings", icon: Settings },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "about-pharma", label: "About", icon: Info },
];

/* Detects which Profile section is currently the primary visible one.
   Uses IntersectionObserver so it works regardless of which element is the
   scroll container, then resolves the active section from each section's
   distance to a reference line in the upper part of the viewport. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (elements.length === 0) return undefined;

    let frame = 0;
    const referenceLine = () => window.innerHeight * 0.4;
    const compute = () => {
      let current = ids[0];
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= referenceLine()) current = el.id;
      }
      setActive((prev) => (prev === current ? prev : current));
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    const observer = new IntersectionObserver(schedule, { rootMargin: "0px", threshold: 0 });
    elements.forEach((el) => observer.observe(el));
    compute();

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);

  return active;
}

export function ProfileNav() {
  const ids = PROFILE_SECTIONS.map((s) => s.id);
  const active = useActiveSection(ids);

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Desktop / tablet: compact icon rail that expands on hover */}
      <div className="hidden md:block">
        <nav
          aria-label="Profile sections"
          className="group sticky top-24 w-11 overflow-hidden rounded-xl border border-border bg-card py-2 shadow-sm transition-[width] duration-300 ease-out hover:w-52"
        >
          <ul className="flex flex-col gap-1 px-1.5">
            {PROFILE_SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => goTo(id)}
                    aria-current={isActive ? "true" : undefined}
                    title={label}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile: compact horizontal pill selector */}
      <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:hidden">
        <nav aria-label="Profile sections" className="flex gap-1.5 overflow-x-auto pb-1">
          {PROFILE_SECTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
