import { useCallback, useEffect, useMemo, useState } from "react";
import { useDb } from "@/hooks/useDb";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { buildRoleViews } from "@/lib/rolesApi";

// Role definitions come from the same persisted backend member list the Users
// and Staff Access tabs render, so assigned-user counts on the Roles tab can
// never disagree with the team list. Permissions are still read from the local
// policy store (configured via the policy builder).
export function useRoles() {
  const permissions = useDb((d) => d.permissions);
  const { members, loadingRemote, offline, loadError, loadRemote } = useTeamMembers();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loadError) {
      setStatus("error");
      setError(loadError);
      return;
    }
    if (loadingRemote) {
      setStatus("loading");
      return;
    }
    setStatus("loaded");
    setError(null);
  }, [loadingRemote, loadError]);

  // Counts only reflect real members — pending invitations never inflate an
  // "assigned staff" count.
  const teamRows = useMemo(() => (members ?? []).filter((m) => !m.invitationId), [members]);

  const roles = useMemo(() => buildRoleViews(teamRows, permissions), [teamRows, permissions]);

  const refresh = useCallback(() => loadRemote(), [loadRemote]);

  return { status, error, roles, profiles: teamRows, refresh };
}
