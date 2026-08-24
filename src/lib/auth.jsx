import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api";
import { resetStoredOnboarding } from "./onboardingApi";

const SESSION_KEY = "PharmaHub_session_v2";
// Keys written by older builds. They are swept on boot so they can never
// influence the authenticated session.
const LEGACY_STORAGE_KEYS = ["PharmaHub_db_v2", "PharmaHub_db_v3", "PharmaHub_session_v1"];
const AuthContext = createContext(null);

// Profile fields the backend allows editing via PUT /auth/profile. Role,
// permissions, and organization membership are deliberately absent — the
// authenticated identity is owned by the backend, not by client payloads.
const PROFILE_EDITABLE_FIELDS = [
  "name",
  "email",
  "phone",
  "orgName",
  "tagline",
  "description",
  "businessEmail",
  "website",
  "address",
  "city",
  "state",
  "pincode",
  "gstin",
  "licenseNo",
  "businessType",
  "services",
  "businessHours",
  "metaPixelId",
  "branches",
  "onboarded",
];

function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(payload) {
  if (typeof window === "undefined") return;
  try {
    if (payload) window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    try {
      for (const key of LEGACY_STORAGE_KEYS) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    (async () => {
      try {
        // GET /auth/me is the only source of truth for the signed-in identity.
        const me = await apiRequest("/auth/me");
        if (cancelled) return;
        const stored = readSession();
        if (stored?.token) writeSession({ token: stored.token, user: me });
        setUser(me);
      } catch {
        // No valid backend session (missing/expired token or server
        // unreachable) — stay signed out. Never fall back to a cached user:
        // stale identities must not masquerade as the logged-in account.
        if (cancelled) return;
        writeSession(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cross-tab and window-focus session synchronization.
  // When another tab logs in, logs out, or changes tokens (e.g. accepting an invitation),
  // immediately update the user state from /auth/me so in-memory user matches the active session.
  useEffect(() => {
    const syncSession = async () => {
      const stored = readSession();
      if (!stored?.token) {
        setUser(null);
        return;
      }
      try {
        const me = await apiRequest("/auth/me");
        setUser(me);
      } catch {
        // Token invalid or server unreachable
      }
    };

    const handleStorage = (e) => {
      if (e.key === SESSION_KEY) {
        syncSession();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncSession);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncSession);
    };
  }, []);

  // Establishes a session from a freshly issued credential, then resolves the
  // authoritative identity from GET /auth/me so role/permissions always come
  // from the database rather than from whatever an individual endpoint echoed.
  const establishSession = useCallback(async (token, fallbackUser) => {
    writeSession({ token, user: fallbackUser ?? null });
    let resolved = fallbackUser ?? null;
    try {
      const me = await apiRequest("/auth/me");
      if (me) resolved = me;
    } catch {
      // Keep the just-issued payload; never merge with any older cached user.
    }
    writeSession({ token, user: resolved });
    setUser(resolved);
    return resolved;
  }, []);

  const signIn = useCallback(
    async (email, password) => {
      resetStoredOnboarding();
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return establishSession(data.token, data.user);
    },
    [establishSession],
  );

  const signUp = useCallback(
    async ({ email, password, name }) => {
      resetStoredOnboarding();
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: name ?? (email.split("@")[0]?.trim() || "PharmaHub User"),
        }),
      });
      return establishSession(data.token, data.user);
    },
    [establishSession],
  );

  // Used by the Google redirect callback page to restore the session handed
  // back via the URL fragment.
  const restoreSession = useCallback(
    async ({ token, user }) => establishSession(token, user),
    [establishSession],
  );

  // Final step of a Google sign-up: verify the emailed OTP, then the backend
  // creates the account and returns a fresh session.
  const completeGoogleOtp = useCallback(
    async ({ token, code }) => {
      const data = await apiRequest("/auth/google/verify-otp", {
        method: "POST",
        body: JSON.stringify({ token, code }),
      });
      return establishSession(data.token, data.user);
    },
    [establishSession],
  );

  // Re-resolves the authoritative identity from GET /auth/me and replaces the
  // current session user. Used after flows that change role/permissions
  // server-side (e.g. onboarding completion) so the UI never renders from a
  // stale identity.
  const refreshUser = useCallback(async () => {
    try {
      const me = await apiRequest("/auth/me");
      if (!me) return null;
      const stored = readSession();
      if (stored?.token) writeSession({ token: stored.token, user: me });
      setUser(me);
      return me;
    } catch {
      // Server unreachable or token expired — keep the current identity.
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore — session is cleared locally regardless
    } finally {
      writeSession(null);
      resetStoredOnboarding();
      setUser(null);
    }
  }, []);

  // Profile fields the backend allows editing via PUT /auth/profile. Role,
  // permissions, and organization membership are deliberately absent — the
  // authenticated identity is owned by the backend, not by client payloads.
  const updateProfile = useCallback(async (changes = {}) => {
    const body = {};
    for (const key of PROFILE_EDITABLE_FIELDS) {
      if (changes[key] !== undefined) body[key] = changes[key];
    }
    if (Object.keys(body).length === 0) {
      throw new Error("No editable profile fields provided");
    }

    const payload = await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // The response replaces the current identity wholesale — it is never
    // merged with stale state, so no old role/permissions can survive.
    let me = payload?.user ?? payload;
    if (me && payload?.profileCompletion) me.profileCompletion = payload.profileCompletion;

    const stored = readSession();
    if (stored?.token) writeSession({ token: stored.token, user: me });
    setUser(me);
    return me;
  }, []);

  const requestPasswordReset = useCallback(async () => {
    // No backend endpoint yet — simulate.
    await new Promise((r) => setTimeout(r, 400));
  }, []);

  const demoLoginRequest = useCallback(async (email) => {
    const data = await apiRequest("/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return data;
  }, []);

  const demoLoginVerify = useCallback(async (token) => {
    const data = await apiRequest("/auth/demo-login/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    writeSession({ token: data.token, user: data.user });
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshUser,
        restoreSession,
        completeGoogleOtp,
        requestPasswordReset,
        demoLoginRequest,
        demoLoginVerify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
