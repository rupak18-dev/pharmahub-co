import { useCallback, useEffect, useMemo, useState } from "react";
import { useDb } from "@/hooks/useDb";
import { buildRoleViews } from "@/lib/rolesApi";

export function useRoles() {
  const profiles = useDb((d) => d.profiles);
  const permissions = useDb((d) => d.permissions);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    const t = setTimeout(() => {
      if (cancelled) return;
      setStatus("loaded");
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [attempt]);

  const roles = useMemo(() => buildRoleViews(profiles, permissions), [profiles, permissions]);

  const refresh = useCallback(() => setAttempt((a) => a + 1), []);

  return { status, error, roles, profiles, refresh };
}
