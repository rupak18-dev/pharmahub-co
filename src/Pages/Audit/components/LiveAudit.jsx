import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Flag,
  ListChecks,
  Mic,
  Pause,
  Play,
  ScanLine,
  Search,
  Send,
  SkipForward,
  StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Progress } from "@/Components/ui/progress";
import { Textarea } from "@/Components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { auditProgress, AUDIT_STATUS_META } from "@/lib/audit";
function deviceLabel() {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  if (/iPad|iPhone/i.test(ua)) return "iPhone · Camera";
  if (/Android/i.test(ua)) return "Android · Camera";
  return "Web · Chrome";
}
function resizeImage(dataUrl, maxSize = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = dataUrl;
  });
}
function hasBarcodeSupport() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}
export function LiveAudit({
  audit,
  allAudits,
  items,
  counts,
  has,
  onCount,
  onSkip,
  onFlag,
  onPause,
  onResume,
  onSubmit,
  onSwitchAudit,
}) {
  const [search, setSearch] = useState("");
  const [currentId, setCurrentId] = useState(null);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState();
  const [voiceNote, setVoiceNote] = useState();
  const [recording, setRecording] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoInputRef = useRef(null);
  const progress = useMemo(() => auditProgress(audit, counts), [audit, counts]);
  const active = useMemo(
    () => items.find((i) => i.batchId === currentId) ?? null,
    [items, currentId],
  );
  const remaining = useMemo(() => items.filter((i) => !i.count || i.count.skipped), [items]);
  const countedItems = useMemo(() => items.filter((i) => i.count && !i.count.skipped), [items]);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return items
      .filter((i) =>
        `${i.medicineName} ${i.batchNumber} ${i.shelf} ${i.barcode ?? ""}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [items, search]);
  const current =
    active ??
    searchResults.find((i) => i.batchId === currentId) ??
    remaining.find((i) => i.batchId === currentId) ??
    null;
  const select = (id) => {
    setCurrentId(id);
    const item = items.find((i) => i.batchId === id);
    if (item?.count && !item.count.skipped) {
      setQty(String(item.count.physicalQty ?? ""));
      setNote(item.count.note ?? "");
    } else {
      setQty("");
      setNote("");
    }
    setPhoto(undefined);
    setVoiceNote(undefined);
    setSearch("");
  };
  const save = () => {
    if (!current) return;
    const n = parseInt(qty, 10);
    if (Number.isNaN(n) || n < 0) return;
    onCount(current.batchId, n, {
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(photo ? { photo } : {}),
      ...(voiceNote ? { voiceNote } : {}),
      device: deviceLabel(),
    });
    const next = remaining.find((i) => i.batchId !== current.batchId && i.batchId !== currentId);
    if (next) setCurrentId(next.batchId);
    else setCurrentId(null);
    setQty("");
    setNote("");
    setPhoto(undefined);
    setVoiceNote(undefined);
  };
  const saveAndNext = () => {
    if (!current) return;
    const n = parseInt(qty, 10);
    if (Number.isNaN(n) || n < 0) return;
    onCount(current.batchId, n, {
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(photo ? { photo } : {}),
      ...(voiceNote ? { voiceNote } : {}),
      device: deviceLabel(),
    });
    setQty("");
    setNote("");
    setPhoto(undefined);
    setVoiceNote(undefined);
  };
  const handleBarcodeSubmit = () => {
    const query = search.trim().toLowerCase();
    if (!query) return;
    const match = items.find(
      (i) => (i.barcode ?? "").toLowerCase() === query || i.batchNumber.toLowerCase() === query,
    );
    if (match) {
      select(match.batchId);
      setScanError("");
    } else {
      setScanError(`No item matches "${query}"`);
    }
  };
  const openScanner = async () => {
    setScannerOpen(true);
    setScanError("");
    const Detector = window.BarcodeDetector;
    if (!Detector) {
      setScanError(
        "Camera scanning is not supported in this browser. Use the search box or a USB scanner.",
      );
      setScannerOpen(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "code_128", "code_39", "qr_code"],
      });
      const tick = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            closeScanner();
            setSearch(codes[0].rawValue);
            handleBarcodeSubmit();
            return;
          }
        } catch {
          /* frame failed — keep trying */
        }
        requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setScanError("Camera permission denied or unavailable.");
      setScannerOpen(false);
    }
  };
  const closeScanner = () => {
    setScannerOpen(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => setVoiceNote(reader.result);
          reader.readAsDataURL(blob);
        }
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };
  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      setPhoto(await resizeImage(dataUrl));
    } catch {
      setPhoto(undefined);
    }
  };
  const openItems = remaining;
  const status = AUDIT_STATUS_META[audit.status];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{audit.title}</h2>
            <Badge className={cn("border shrink-0", status.chip)}>{status.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {audit.auditNumber} · {audit.branch} · scheduled{" "}
            {format(new Date(audit.scheduledDate), "d MMM")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={audit.id}
            onValueChange={(v) => {
              onSwitchAudit(v);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Switch audit" />
            </SelectTrigger>
            <SelectContent>
              {allAudits
                .filter(
                  (a) =>
                    a.id !== audit.id &&
                    (a.status === "in_progress" ||
                      a.status === "paused" ||
                      a.status === "scheduled"),
                )
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.auditNumber} · {a.branch}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {audit.status === "in_progress" ? (
            <Button size="sm" variant="outline" onClick={onPause}>
              <Pause className="mr-1 h-3.5 w-3.5" /> Pause
            </Button>
          ) : audit.status === "paused" ? (
            <Button size="sm" variant="outline" onClick={onResume}>
              <Play className="mr-1 h-3.5 w-3.5" /> Resume
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={() => {
              if (
                progress.remaining > 0 &&
                !confirm(
                  `Submit ${audit.auditNumber} with ${progress.remaining} items not yet counted?`,
                )
              ) {
                return;
              }
              onSubmit();
            }}
          >
            <Send className="mr-1 h-3.5 w-3.5" /> Submit for review
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium">Live progress</span>
          <span className="font-mono text-xs text-muted-foreground">
            {progress.verified}/{progress.total} counted · {progress.pct}%
          </span>
        </div>
        <Progress value={progress.pct} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {progress.remaining} remaining · {countedItems.filter((i) => i.count?.flagged).length}{" "}
          flagged
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 pb-20 sm:pb-0">
          {/* Search & Scan Header (Sticky on Mobile) */}
          <div className="sticky top-0 z-20 flex items-center gap-2 bg-background/95 backdrop-blur-xs py-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (scanError) setScanError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeSubmit();
                  }
                }}
                placeholder="Scan barcode or search name/batch…"
                className="w-full pl-9 min-h-[44px] text-sm"
                autoFocus
              />
            </div>
            {hasBarcodeSupport() && (
              <Button
                size="sm"
                variant="outline"
                className="min-h-[44px] px-3 shrink-0"
                onClick={openScanner}
              >
                <ScanLine className="mr-1.5 h-4 w-4" /> Scan
              </Button>
            )}
          </div>

          {scannerOpen && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-medium">Point camera at barcode</span>
                <Button size="sm" variant="ghost" className="min-h-[38px]" onClick={closeScanner}>
                  Close
                </Button>
              </div>
              <video ref={videoRef} className="aspect-video w-full bg-black" playsInline muted />
            </div>
          )}
          {scanError && <p className="text-xs text-destructive">{scanError}</p>}

          {searchResults.length > 0 && !current && (
            <div className="space-y-2">
              {searchResults.map((i) => (
                <button
                  key={i.batchId}
                  type="button"
                  onClick={() => select(i.batchId)}
                  className="w-full rounded-lg border border-border bg-card px-3.5 py-3 text-left hover:bg-accent active:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-semibold">{i.medicineName}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.batchNumber} · {i.shelf} · expected {i.expectedQty}
                  </p>
                </button>
              ))}
            </div>
          )}

          {current ? (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base sm:text-lg font-bold">
                    {current.medicineName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {current.batchNumber} · Shelf {current.shelf} · expected{" "}
                    <span className="font-semibold text-foreground">{current.expectedQty}</span>{" "}
                    units
                  </p>
                </div>
                {current.barcode && (
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                    {current.barcode}
                  </Badge>
                )}
              </div>

              {/* One-Handed Large Quantity Controls */}
              <div className="flex flex-col items-center gap-3 py-1">
                <div className="flex items-center gap-3 w-full justify-center">
                  <Button
                    variant="outline"
                    className="h-16 w-16 text-2xl font-bold rounded-xl shrink-0 active:scale-95 transition-transform"
                    onClick={() => setQty(String(Math.max(0, (parseInt(qty, 10) || 0) - 1)))}
                  >
                    −
                  </Button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="h-20 flex-1 max-w-[200px] rounded-xl border-2 border-border bg-background text-center text-4xl sm:text-5xl font-bold tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <Button
                    variant="outline"
                    className="h-16 w-16 text-2xl font-bold rounded-xl shrink-0 active:scale-95 transition-transform"
                    onClick={() => setQty(String((parseInt(qty, 10) || 0) + 1))}
                  >
                    +
                  </Button>
                </div>

                {/* Quick Add Increment Pills */}
                <div className="flex w-full items-center justify-center gap-2">
                  {[5, 10, 50, 100].map((step) => (
                    <Button
                      key={step}
                      variant="outline"
                      size="sm"
                      className="min-h-[40px] px-3 text-xs font-semibold rounded-lg"
                      onClick={() => setQty(String((parseInt(qty, 10) || 0) + step))}
                    >
                      +{step}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="rounded-lg border border-border px-3 py-2.5 text-left hover:bg-accent active:bg-muted/50 transition-colors min-h-[44px]"
                >
                  {photo ? (
                    <span className="flex items-center gap-2">
                      <img src={photo} alt="" className="h-7 w-7 rounded object-cover" />
                      <span className="text-success font-medium">Photo added</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-muted-foreground" /> Damage Photo
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => (recording ? stopRecording() : startRecording())}
                  className="rounded-lg border border-border px-3 py-2.5 text-left hover:bg-accent active:bg-muted/50 transition-colors min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    {recording ? (
                      <>
                        <StopCircle className="h-4 w-4 text-destructive animate-pulse" /> Stop Rec
                      </>
                    ) : voiceNote ? (
                      <>
                        <Mic className="h-4 w-4 text-success" /> Voice Saved
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 text-muted-foreground" /> Voice Note
                      </>
                    )}
                  </span>
                </button>
              </div>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="audit-photo"
                ref={photoInputRef}
                className="hidden"
                onChange={(e) => {
                  handlePhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Note (condition, location, expiry remark…)"
                className="text-sm min-h-[60px]"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none min-h-[44px]"
                  onClick={() => {
                    onSkip(current.batchId);
                    const next = remaining.find((i) => i.batchId !== current.batchId);
                    setCurrentId(next?.batchId ?? null);
                  }}
                >
                  <SkipForward className="mr-1.5 h-4 w-4" /> Skip Item
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none min-h-[44px] text-warning-foreground"
                  onClick={() =>
                    onFlag(current.batchId, {
                      ...(note.trim() ? { note: note.trim() } : {}),
                      device: deviceLabel(),
                    })
                  }
                >
                  <Flag className="mr-1.5 h-4 w-4" /> Flag
                </Button>
              </div>

              {/* Sticky Bottom Action Bar on Mobile / Desktop Primary Trigger */}
              <div className="fixed sm:sticky bottom-0 left-0 right-0 sm:bottom-auto p-3 sm:p-0 bg-card/95 sm:bg-transparent border-t border-border sm:border-0 backdrop-blur-xs z-30 flex items-center justify-between gap-2 shadow-lg sm:shadow-none">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none min-h-[48px] sm:min-h-[38px]"
                  onClick={() => {
                    const idx = items.findIndex((i) => i.batchId === current.batchId);
                    if (idx > 0) select(items[idx - 1].batchId);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none min-h-[48px] sm:min-h-[38px]"
                  onClick={onPause}
                >
                  Pause
                </Button>
                <Button
                  className="flex-1 sm:flex-none min-h-[48px] sm:min-h-[38px] font-bold"
                  onClick={save}
                  disabled={Number.isNaN(parseInt(qty, 10)) || parseInt(qty, 10) < 0}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Save & Next
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center space-y-2">
              <ListChecks className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-semibold">No item selected</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Scan a barcode, search above, or pick an item from the queue below.
              </p>
            </div>
          )}

          {openItems.length === 0 && countedItems.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> All items counted. Ready to submit for review.
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Queue</h3>
              <span className="text-xs text-muted-foreground">{openItems.length} left</span>
            </div>
            <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
              {openItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">All caught up 🎉</p>
              ) : (
                openItems.map((i) => (
                  <button
                    key={i.batchId}
                    type="button"
                    onClick={() => select(i.batchId)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                      current?.batchId === i.batchId && "bg-accent",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{i.medicineName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {i.batchNumber} · {i.shelf}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {i.expectedQty}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">Counted ({countedItems.length})</h3>
            <div className="max-h-[240px] space-y-1 overflow-y-auto pr-1">
              {countedItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nothing counted yet
                </p>
              ) : (
                countedItems.map((i) => {
                  const ok = i.count?.physicalQty === i.expectedQty;
                  return (
                    <div
                      key={i.batchId}
                      className="flex items-center justify-between gap-2 px-2 py-1 text-xs"
                    >
                      <span className="min-w-0 truncate">{i.medicineName}</span>
                      <span
                        className={cn(
                          "shrink-0 font-mono tabular-nums",
                          ok ? "text-success" : "text-warning-foreground",
                        )}
                      >
                        {i.count?.physicalQty} / {i.expectedQty}
                        {i.count?.flagged && (
                          <AlertCircle className="ml-1 inline h-3 w-3 text-destructive" />
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
