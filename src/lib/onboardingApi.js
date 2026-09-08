import { apiRequest } from "./api";

const STORAGE_KEY = "PharmaHub_onboarding_v1";
const COMPLETED_KEY = "PharmaHub_onboarding_completed_v1";

function readLocal() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function clearLocal() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function readCompleted() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COMPLETED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCompleted(marker) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(marker));
  } catch {
    // ignore
  }
}

// Frontend source of truth for "onboarding done". The backend does not return
// an `onboarded` field for the current user, so once the completion step runs
// we persist a per-user marker locally. Returns true for server-onboarded users
// as well so a future backend fix keeps working without client changes.
export function isOnboarded(user) {
  if (!user) return false;
  if (user.onboarded === true) return true;
  const marker = readCompleted();
  return marker[user.id] === true;
}

export function markComplete(userId) {
  if (!userId) return;
  writeCompleted({ ...readCompleted(), [userId]: true });
}

export function resetOnboardingStorage() {
  clearLocal();
}

// Server-backed (then local fallback) onboarding store.
// The backend `/onboarding` collection is the source of truth for the CURRENT
// user. localStorage is only used as an offline fallback when the server is
// unreachable — a fresh account must always start from step 0, never inherit a
// previous user's progress (which previously jumped straight to the dashboard).
export const getStoredOnboarding = () => readLocal();

export const getOnboarding = async () => {
  try {
    const remote = await apiRequest("/onboarding");
    const hasRemote = remote && typeof remote === "object" && Object.keys(remote).length > 0;
    if (hasRemote) {
      writeLocal(remote);
      return remote;
    }
    // No saved progression for this account — ignore any stale local copy so
    // this new user starts onboarding clean from the first step.
    return null;
  } catch {
    // Backend unreachable — fall back to the local copy (callers still decide
    // whether that copy belongs to this account).
    return readLocal();
  }
};

export const saveOnboarding = async (data) => {
  writeLocal(data);
  try {
    await apiRequest("/onboarding", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch {
    // Backend may not be reachable — the local copy persists progress.
  }
};
