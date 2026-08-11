import { useState } from "react";
import {
  KeyRound,
  Lock,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";

export const handle = { title: "Security Settings · PharmaHub" };

export default function SecurityPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully!");
    }, 400);
  };

  return (
    <div className="w-full pb-16 pt-2">
      <div className="mx-auto w-full max-w-[1000px] space-y-8 px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-border/60 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Security Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account password, active sessions, and security verification.
          </p>
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Change Password
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ensure your account uses a strong, unique password.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="currentPass" className="text-xs font-semibold">Current Password</Label>
              <Input
                id="currentPass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPass" className="text-xs font-semibold">New Password</Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPass" className="text-xs font-semibold">Confirm New Password</Label>
              <Input
                id="confirmPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={updating}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl text-xs h-9 px-5 gap-2"
            >
              {updating ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>

        {/* Active Sessions Section */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Active Sessions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Devices currently signed in to your account.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground">Current Web Browser Session</h4>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">
                      This Device
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Mac OS X • Chrome • Active Now
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
