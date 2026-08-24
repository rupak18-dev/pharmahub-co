import { useCallback, useEffect, useRef, useState } from "react";
import { listRoles } from "@/lib/rolesService";
import { isNetworkError } from "@/lib/api";

/* Loads role definitions from the backend Role collection (GET /roles).
   `refresh` re-fetches; callers render the same status contract as before
   ("loading" | "error" | "loaded"). */
export function useRoles() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    // Keep "loaded" during background refreshes so an open detail modal does
    // not trigger the panel's loading skeletons.
    setStatus((prev) => (prev === "loaded" ? prev : "loading"));
    try {
      const data = await listRoles();
      if (!mounted.current) return;
      setRoles(data);
      setStatus("loaded");
    } catch (e) {
      if (!mounted.current) return;
      setError(e?.message ?? "Failed to load roles");
      // Offline / server unreachable: keep whatever list we have rather than
      // a hard error wall for transient network blips.
      setStatus(isNetworkError(e) ? "loaded" : "error");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, error, roles, refresh };
}
