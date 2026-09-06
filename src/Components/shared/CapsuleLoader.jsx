import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const MIN_STAGE_MS = 2000;

function stageStatus(progress, index, total, activeIndex) {
  const ceiling = Math.round(((index + 1) / total) * 100);
  if (progress >= ceiling) return "done";
  if (index < activeIndex || index === activeIndex) return "active";
  return "pending";
}

export function CapsuleLoader({
  minimumMs = 5000,
  message = "Loading PharmaHub…",
  stages = [],
  error = null,
  onDone,
  variant = "bar",
}) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const stagesRef = useRef(stages);
  stagesRef.current = stages;
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const stageKey = stages.map((s) => (typeof s === "string" ? s : s.id)).join("|");

  useEffect(() => {
    const stagesList = stagesRef.current;
    const hasRunners = stagesList.some(
      (s) => typeof s === "object" && s && typeof s.run === "function",
    );

    if (!hasRunners) {
      const startedAt = Date.now();
      const tick = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const next = Math.min(100, Math.round((elapsed / minimumMs) * 100));
        setProgress(next);
        if (next >= 100) {
          clearInterval(tick);
          onDoneRef.current?.();
        }
      }, 50);
      return () => clearInterval(tick);
    }

    let cancelled = false;
    const total = stagesList.length;

    const runStage = async (index) => {
      if (cancelled) return;
      const from = Math.round((index / total) * 100);
      const to = Math.round(((index + 1) / total) * 100);
      const stage = stagesList[index];
      const started = Date.now();

      setActiveIndex(index);
      setProgress(from);

      const ease = new Promise((resolve) => {
        const tickEase = setInterval(() => {
          if (cancelled) {
            clearInterval(tickEase);
            resolve();
            return;
          }
          const p = Math.min(1, (Date.now() - started) / MIN_STAGE_MS);
          setProgress(Math.round(from + (to - from) * p));
          if (p >= 1) {
            clearInterval(tickEase);
            resolve();
          }
        }, 50);
      });

      const work = (async () => {
        try {
          await stage?.run?.();
        } catch {
          // A failed stage should never block the rest of the setup.
        }
      })();

      await Promise.all([ease, work]);
      if (index < total - 1) await runStage(index + 1);
      else if (!cancelled) {
        setProgress(100);
        onDoneRef.current?.();
      }
    };

    runStage(0);
    return () => {
      cancelled = true;
    };
  }, [stageKey, minimumMs]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center">
        <div className="text-3xl font-bold tracking-tight">
          Pharma<span className="text-primary">Hub</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>

        {stages.length > 0 && (
          <ul className="w-full space-y-2.5 text-left">
            {stages.map((stage, index) => {
              const label = typeof stage === "string" ? stage : stage.label;
              const status = stageStatus(progress, index, stages.length, activeIndex);
              return (
                <motion.li
                  key={typeof stage === "string" ? stage : stage.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.25, ease: "easeOut" }}
                  className="flex items-center gap-3"
                >
                  {status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : status === "active" ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={
                      status === "pending"
                        ? "text-sm font-medium text-muted-foreground/50"
                        : "text-sm font-medium text-foreground"
                    }
                  >
                    {label}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        )}

        {variant === "circular" ? (
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <Loader2 className="h-14 w-14 animate-spin text-primary" />
          </div>
        ) : (
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-500 transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="text-2xl font-bold tabular-nums text-primary">{progress}%</div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>
    </div>
  );
}
