import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { cn } from "@/lib/utils";

/* Shared Bento card shell for every Profile section so the grid reads as one
   consistent settings workspace: icon + title + description on top, content
   in the middle, optional actions pinned to the bottom. Cards stretch to fill
   their grid cell height naturally without forcing a minimum viewport height. */
export function ProfileSectionCard({
  id,
  icon: Icon,
  title,
  description,
  footer,
  children,
  className,
}) {
  return (
    <section id={id} className={cn("flex flex-col scroll-mt-28 min-w-0 w-full", className)}>
      <Card className="flex min-w-0 flex-col overflow-hidden border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 border-b border-border bg-muted/20 px-6 py-5 sm:px-6">
          <span
            className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground/70 shadow-xs"
            aria-hidden="true"
          >
            <Icon className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs">{description}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5 sm:px-6">{children}</CardContent>
        {footer && (
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-4 sm:px-6">
            {footer}
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
