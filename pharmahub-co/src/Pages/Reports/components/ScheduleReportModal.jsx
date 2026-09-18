import { useState } from "react";
import { Bell, Calendar, Clock, Mail, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { reportService } from "@/lib/reportService";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { cn } from "@/lib/utils";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function ScheduleReportModal({ open, onOpenChange, reportConfig }) {
  const profiles = useDb((d) => d.profiles || []);
  // Only use real registered users — never fake emails
  const registeredUsers = profiles
    .filter((p) => p.email)
    .map((p) => ({ email: p.email, name: p.name ?? p.email, role: p.role ?? "" }));

  const [reportName, setReportName] = useState(() => reportConfig?.name ?? "");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("09:00");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleUser = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedEmails.length === 0 && registeredUsers.length > 0) {
      toast.error("Please select at least one recipient.");
      return;
    }
    setIsSubmitting(true);
    try {
      await reportService.scheduleReport({
        reportName: reportName.trim() || reportConfig?.name || "Scheduled Report",
        config: reportConfig,
        recipients: selectedEmails,
        frequency,
        time,
        status: "active",
      });
      toast.success(`Schedule saved — will run ${frequency} at ${time}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to save schedule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Coloured header band */}
        <div className="bg-accent/60 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              Schedule Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Automatically generate and deliver this report on a recurring schedule.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-5">
          {/* Report Name */}
          <div className="space-y-1.5">
            <Label htmlFor="sched-name" className="text-xs font-medium">
              Report Name
            </Label>
            <Input
              id="sched-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. Daily Sales Summary"
              className="h-9 text-sm"
              required
            />
          </div>

          {/* Frequency — Button group */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Frequency
            </Label>
            <div className="flex items-center gap-1.5">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                    frequency === f.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {frequency === "weekly" && "Runs every Monday."}
              {frequency === "monthly" && "Runs on the 1st of each month."}
              {frequency === "daily" && "Runs every day."}
            </p>
          </div>

          {/* Delivery Time */}
          <div className="space-y-1.5">
            <Label htmlFor="sched-time" className="text-xs font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Delivery Time
            </Label>
            <Input
              id="sched-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-9 text-sm w-40"
              required
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Recipients
            </Label>

            {registeredUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                <Mail className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No registered users available.</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Add users to the system to enable scheduled email delivery.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                {registeredUsers.map((user, i) => {
                  const isSelected = selectedEmails.includes(user.email);
                  return (
                    <button
                      key={user.email}
                      type="button"
                      onClick={() => toggleUser(user.email)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        i > 0 && "border-t border-border",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/40",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {user.email}
                          {user.role && (
                            <span className="ml-1.5 text-[10px] font-sans not-italic">
                              · {user.role}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedEmails.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {selectedEmails.length} recipient{selectedEmails.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Status preview */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700">
              Schedule will be set to <span className="font-semibold">Active</span> immediately.
            </p>
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 text-xs font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
