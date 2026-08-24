import { useCallback, useEffect, useMemo, useState } from "react";

import { isNetworkError } from "@/lib/api";
import { usersService } from "@/lib/usersService";
import { invitationService } from "@/lib/invitationService";

import { useDb } from "./useDb";

// Team members = backend users + invitations merged into a single row list.
// The backend is the single source of truth; the local profile collection is
// ONLY an offline fallback when the API is genuinely unreachable (network
// error). Both UsersTab and StaffAccessPanel consume this hook so they always
// render the same members from the same persisted source.
export function useTeamMembers() {
  const profiles = useDb((d) => d.profiles);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteInvitations, setRemoteInvitations] = useState([]);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const loadRemote = useCallback(async () => {
    setLoadingRemote(true);
    setLoadError(null);
    try {
      const [users, invitations] = await Promise.all([
        usersService.list(),
        invitationService.list(),
      ]);
      setRemoteUsers(Array.isArray(users) ? users : []);
      setRemoteInvitations(Array.isArray(invitations) ? invitations : []);
      setOffline(false);
    } catch (error) {
      if (isNetworkError(error)) {
        // Backend genuinely unreachable → offline fallback to the locally
        // mirrored (real, non-demo) profiles.
        setOffline(true);
        setLoadError(null);
      } else {
        // Backend reachable but returned an error (401/403/500/…). Never
        // fall back to local data here — surface the failure with a retry.
        setOffline(false);
        if (error.status === 401) {
          setLoadError("Your session has expired. Please sign in again.");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("pharmahub:unauthorized"));
          }
        } else {
          setLoadError(
            error instanceof Error ? error.message : "Something went wrong. Please try again.",
          );
        }
      }
    } finally {
      setLoadingRemote(false);
    }
  }, []);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  // Refetch when the invite drawer reports a successful invitation.
  useEffect(() => {
    const handler = () => loadRemote();
    window.addEventListener("pharmahub:invitations-changed", handler);
    return () => window.removeEventListener("pharmahub:invitations-changed", handler);
  }, [loadRemote]);

  // Refetch when the tab/window regains focus. An invitee accepts their
  // invitation in their own browser, so this session can't be pushed the
  // change — refreshing on focus keeps the Users/Staff Access lists current
  // (accepted invitations flip from pending rows to real user rows) without
  // waiting for a remount or manual reload.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") loadRemote();
    };
    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [loadRemote]);

  // Merge backend users + invitations into one row list. Only PENDING
  // invitations appear as rows; accepted/used invitations are lifecycle
  // records of users who already joined, represented by their user row from
  // the users API. Rendering them here would resurrect a member who was later
  // removed, because removed users are absent from the users list.
  const members = useMemo(() => {
    if (loadError) return [];
    if (offline) return profiles.filter((p) => p.status !== "removed");

    const list = [];
    const userEmails = new Set();
    for (const u of remoteUsers) {
      userEmails.add((u.email || "").toLowerCase());
      const status = u.status ?? (u.active ? "active" : "inactive");
      list.push({
        id: u.id,
        name: u.name || "—",
        email: u.email || "",
        phone: u.phone || "",
        role: u.role || "Pharmacist",
        orgName: u.orgName || "",
        designation: u.designation ?? null,
        department: u.department ?? null,
        accessIds: Array.isArray(u.accessIds) ? u.accessIds : [],
        permissions: u.permissions ?? {},
        featureAccess: u.featureAccess ?? {},
        status,
        active: status === "active",
        createdAt: u.createdAt || new Date().toISOString(),
        invitationId: null,
        phoneVerified: u.phoneVerified === true,
      });
    }
    for (const inv of remoteInvitations) {
      if (inv.status !== "pending") continue;
      list.push({
        id: inv.id,
        name: inv.name || inv.email.split("@")[0],
        email: inv.email || "",
        phone: inv.phone || "",
        role: inv.role || "Pharmacist",
        orgName: inv.orgName || "",
        designation: null,
        department: inv.department ?? null,
        accessIds: Array.isArray(inv.accessIds) ? inv.accessIds : [],
        permissions: inv.permissions ?? {},
        featureAccess: inv.featureAccess ?? {},
        status: "pending",
        active: false,
        createdAt: inv.createdAt || new Date().toISOString(),
        invitationId: inv.id,
        phoneVerified: false,
      });
    }
    return list;
  }, [loadError, offline, profiles, remoteUsers, remoteInvitations]);

  return { members, loadingRemote, offline, loadError, loadRemote };
}
