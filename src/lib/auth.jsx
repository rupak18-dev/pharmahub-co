import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api";
import { db } from "./db";

const SESSION_KEY = "PharmaHub_session_v2";
const AuthContext = createContext(null);

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
    (async () => {
      try {
        const me = await apiRequest("/auth/me");
        if (cancelled) return;
        const stored = readSession();
        // The deployed backend may still run a dev-bypass that returns a
        // hardcoded demo user on /auth/me. Don't let that clobber a real
        // stored session (which may carry `onboarded` and the user's profile).
        const isDevBypass = !!me && me.email === "owner@pharmahub.demo";
        const nextUser = stored?.token && isDevBypass && stored.user ? stored.user : me;
        if (stored?.token) writeSession({ token: stored.token, user: nextUser });
        setUser(nextUser);
      } catch {
        // No valid session (token missing/expired) — stay signed out or restore cached.
        if (cancelled) return;
        const stored = readSession();
        setUser(stored?.user ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      writeSession({ token: data.token, user: data.user });
      setUser(data.user);
      return data.user;
    } catch (err) {
      // Fallback to mock DB if backend is not running
      const found = db.get().profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase() && p.active);
      if (!found) throw new Error("No account found for that email");
      writeSession({ token: found.id, user: found });
      setUser(found);
      return found;
    }
  }, []);

  const signUp = useCallback(async ({ email, password, name }) => {
    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: name ?? (email.split("@")[0]?.trim() || "PharmaHub User"),
        }),
      });
      writeSession({ token: data.token, user: data.user });
      setUser(data.user);
      return data.user;
    } catch (err) {
      // Fallback to mock DB
      const existing = db.get().profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
      if (existing) throw new Error("An account already exists with that email");
      const profile = {
        id: db.uid(),
        name: name ?? (email.split("@")[0]?.trim() || "PharmaHub User"),
        email,
        role: "Owner",
        active: true,
        createdAt: new Date().toISOString(),
      };
      db.set((d) => {
        d.profiles.push(profile);
      });
      writeSession({ token: profile.id, user: profile });
      setUser(profile);
      return profile;
    }
  }, []);

  // Used by the Google redirect callback page to restore the session handed
  // back via the URL fragment.
  const restoreSession = useCallback(async ({ token, user }) => {
    writeSession({ token, user });
    setUser(user);
    return user;
  }, []);

  // Final step of a Google sign-up: verify the emailed OTP, then the backend
  // creates the account and returns a fresh session.
  const completeGoogleOtp = useCallback(async ({ token, code }) => {
    const data = await apiRequest("/auth/google/verify-otp", {
      method: "POST",
      body: JSON.stringify({ token, code }),
    });
    writeSession({ token: data.token, user: data.user });
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore — session is cleared locally regardless
    } finally {
      writeSession(null);
      setUser(null);
    }
  }, []);

  const switchRole = useCallback(
    (role) => {
      if (!user) return;
      setUser({ ...user, role });
    },
    [user],
  );

  const updateProfile = useCallback(
    async ({ name, role, orgName, onboarded } = {}) => {
      const body = {};
      if (name !== undefined) body.name = name;
      if (role !== undefined) body.role = role;
      if (orgName !== undefined) body.orgName = orgName;
      if (onboarded !== undefined) body.onboarded = onboarded;

      let me = null;
      try {
        me = await apiRequest("/auth/profile", {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } catch {
        // Backend may not expose PUT /auth/profile yet — apply locally so the
        // session (and the `onboarded` flag) still update.
        me = { ...(user || {}), ...body };
      }

      const stored = readSession();
      if (stored?.token) writeSession({ token: stored.token, user: me });
      setUser(me);
      return me;
    },
    [user],
  );

  const requestPasswordReset = useCallback(async () => {
    // No backend endpoint yet — simulate.
    await new Promise((r) => setTimeout(r, 400));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        switchRole,
        updateProfile,
        restoreSession,
        completeGoogleOtp,
        requestPasswordReset,
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
