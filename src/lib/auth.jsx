import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api";

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
        if (stored?.token) writeSession({ token: stored.token, user: me });
        setUser(me);
      } catch {
        // No valid session (token missing/expired) — stay signed out.
        if (cancelled) return;
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (email, password) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    writeSession({ token: data.token, user: data.user });
    setUser(data.user);
    return data.user;
  };

  const signUp = async ({ email, password }) => {
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return signIn(email, password);
  };

  const signOut = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore — session is cleared locally regardless
    } finally {
      writeSession(null);
      setUser(null);
    }
  };

  const switchRole = (role) => {
    if (!user) return;
    setUser({ ...user, role });
  };

  const updateProfile = async ({ name, role, orgName, onboarded } = {}) => {
    const body = {};
    if (name !== undefined) body.name = name;
    if (role !== undefined) body.role = role;
    if (orgName !== undefined) body.orgName = orgName;
    if (onboarded !== undefined) body.onboarded = onboarded;
    const me = await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const stored = readSession();
    if (stored?.token) writeSession({ token: stored.token, user: me });
    setUser(me);
    return me;
  };

  const requestPasswordReset = async () => {
    // No backend endpoint yet — simulate.
    await new Promise((r) => setTimeout(r, 400));
  };

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
