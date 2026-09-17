import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  QrCode,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  getWhatsAppSession,
  logoutWhatsAppSession,
  startWhatsAppSession,
} from "@/lib/integrationsService";

export function WhatsAppConnectDialog({ open, onOpenChange, onConnectedChange }) {
  const [status, setStatus] = useState("checking"); // "checking" | "connecting" | "qr_ready" | "connected" | "disconnected"
  const [qrCode, setQrCode] = useState(null);
  const [phone, setPhone] = useState(null);
  const [starting, setStarting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pollIntervalRef = useRef(null);

  const clearPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const checkStatus = async () => {
    try {
      const data = await getWhatsAppSession();
      if (!data) return;
      setStatus(data.status);
      if (data.phone) setPhone(data.phone);
      if (data.qrCode) setQrCode(data.qrCode);

      if (data.status === "connected") {
        clearPolling();
        onConnectedChange?.(true);
      }
    } catch {
      // Ignore network hiccup
    }
  };

  const startConnection = async (forceNew = false) => {
    setStarting(true);
    try {
      const data = await startWhatsAppSession(forceNew);
      if (data.qrCode) setQrCode(data.qrCode);
      setStatus(data.status);
      if (data.phone) setPhone(data.phone);

      clearPolling();
      pollIntervalRef.current = setInterval(checkStatus, 2500);
    } catch (err) {
      toast.error(err?.message || "Failed to start WhatsApp connection");
      setStatus("disconnected");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      clearPolling();
      return;
    }

    const init = async () => {
      setStatus("checking");
      try {
        const current = await getWhatsAppSession();
        if (current?.status === "connected") {
          setStatus("connected");
          setPhone(current.phone);
          return;
        }
      } catch {
        // Fall through to start
      }
      startConnection(false);
    };

    init();

    return () => clearPolling();
  }, [open]);

  const handleDisconnect = async () => {
    setLoggingOut(true);
    try {
      await logoutWhatsAppSession();
      clearPolling();
      setStatus("disconnected");
      setQrCode(null);
      setPhone(null);
      onConnectedChange?.(false);
      toast.success("WhatsApp disconnected. Session cleared.");
    } catch (err) {
      toast.error(err?.message || "Failed to disconnect WhatsApp");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleRefreshQr = () => {
    startConnection(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-[#25D366]/10"
              aria-hidden="true"
            >
              <SiWhatsapp className="h-5 w-5 text-[#25D366]" />
            </span>
            WhatsApp Business Integration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Link your pharmacy's WhatsApp account once. Bills and invoices will automatically be
            delivered to customers with zero ongoing subscription costs.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* Connected State */}
          {status === "connected" && (
            <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">WhatsApp Linked & Active</h4>
                <p className="text-xs text-muted-foreground">
                  Connected device:{" "}
                  <span className="font-semibold text-foreground">{phone || "Registered Device"}</span>
                </p>
                <div className="pt-1">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[10px]"
                  >
                    ● 100% Free Self-Hosted Session Active
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3 text-left text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How it works:</p>
                <p>
                  Whenever staff generates or saves a bill, PharmaHub will automatically format and
                  send the receipt & PDF invoice directly to the customer's WhatsApp in the
                  background.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive gap-1.5"
                  onClick={handleDisconnect}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Disconnect Device
                </Button>
              </div>
            </div>
          )}

          {/* QR Code Ready State */}
          {status === "qr_ready" && qrCode && (
            <div className="space-y-4 text-center">
              <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-xl border-2 border-dashed border-border bg-white p-2 shadow-sm">
                <img
                  src={qrCode}
                  alt="Scan WhatsApp QR"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>

              <div className="space-y-2 text-left bg-muted/40 rounded-lg p-3 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-[#25D366]" />
                  Scan with your WhatsApp:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] pl-1">
                  <li>Open WhatsApp on your pharmacy mobile phone</li>
                  <li>
                    Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> &gt;{" "}
                    <strong>Linked Devices</strong>
                  </li>
                  <li>
                    Tap <strong>Link a Device</strong> and scan this code
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Waiting for scan...
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={handleRefreshQr}
                  disabled={starting}
                >
                  <RefreshCw className={`h-3 w-3 ${starting ? "animate-spin" : ""}`} />
                  Refresh QR
                </Button>
              </div>
            </div>
          )}

          {/* Connecting / Loading State */}
          {(status === "connecting" || status === "checking" || (starting && !qrCode)) && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Initializing WhatsApp Web session...</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Connecting to WhatsApp service and generating your secure login QR code.
                </p>
              </div>
            </div>
          )}

          {/* Disconnected / Error State */}
          {status === "disconnected" && !starting && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <WifiOff className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">WhatsApp is Disconnected</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Click the button below to generate a new QR code and link your phone.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9 text-xs gap-1.5"
                onClick={() => startConnection(true)}
              >
                <QrCode className="h-4 w-4" />
                Generate QR Code
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            {status === "connected" ? "Done" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
