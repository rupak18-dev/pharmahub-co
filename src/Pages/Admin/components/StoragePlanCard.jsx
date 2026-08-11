import { HardDrive, Sparkles } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Progress } from "@/Components/ui/progress";
import { toast } from "sonner";

export function StoragePlanCard() {
  const handleUpgrade = () => {
    toast.info(
      "Your workspace is currently on the PharmaHub Enterprise plan with unlimited features.",
    );
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-[#007A87] shadow-xs">
              <HardDrive className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Storage & Plan
              </CardTitle>
              <p className="text-xs text-muted-foreground">Workspace usage & subscription</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px] font-semibold bg-[#007A87]/10 text-[#007A87]"
          >
            Enterprise
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-4 text-xs">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1.5">
            <span>Cloud Database Storage</span>
            <span className="tabular-nums font-semibold text-[#007A87]">1.2 GB / 50 GB</span>
          </div>
          <Progress value={2.4} className="h-2" />
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#007A87]" />
            Unlimited AI & Reporting Access
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All pharmacy modules, batch tracking, and predictive expiry alerts are active.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs font-semibold text-[#007A87] hover:bg-[#007A87]/10"
          onClick={handleUpgrade}
        >
          Manage Subscription
        </Button>
      </CardContent>
    </Card>
  );
}
