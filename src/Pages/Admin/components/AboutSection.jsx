import { Info, LifeBuoy, Pill } from "lucide-react";
import { ProfileSectionCard } from "./ProfileSectionCard";

export function AboutSection() {
  return (
    <ProfileSectionCard
      id="about"
      icon={Info}
      title="About PharmaHub"
      description="The pharmacy management platform for your store."
      className="w-full"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 text-primary">
            <Pill className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">PharmaHub</p>
            <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <a
            href="#about"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Terms
          </a>
          <a
            href="#about"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Privacy
          </a>
          <a
            href="mailto:support@pharmahub.example"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <LifeBuoy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Support
          </a>
        </div>
      </div>
    </ProfileSectionCard>
  );
}
