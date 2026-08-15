import { apiRequest } from "./api";

const STORAGE_KEY = "PharmaHub_onboarding_v1";

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

// Local-first onboarding store. localStorage is the reliable source of truth
// (the deployed backend may not expose /onboarding yet); the API sync is
// best-effort and silently ignored when the route is missing.
export const getStoredOnboarding = () => readLocal();

export const getOnboarding = async () => {
  const local = readLocal();
  try {
    const remote = await apiRequest("/onboarding");
    const merged = remote ? { ...local, ...remote } : local;
    if (merged) writeLocal(merged);
    return merged;
  } catch {
    return local;
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
    // Backend may not have /onboarding yet — the local copy persists progress.
  }
};
