import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest, clearCachedResponse } from "./api";
import { db } from "./db";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Session lives in an httpOnly cookie — hydrate the user from the
      // server. Nothing about auth is persisted client-side. /auth/me is never
      // cached: it is session-specific and must always hit the server so stale
      // data from a previous user/demo account can never leak across sessions.
      try {
        const me = await apiRequest("/auth/me", { noCache: true });
        if (!cancelled) setUser(me);
      } catch {
        // No valid session (cookie missing/expired) — stay signed out.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password, { remember = true } = {}) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember }),
    });
    // The server decides the cookie lifetime from `remember` (browser-session
    // vs persistent). Nothing about auth is stored client-side.
    setUser(data.user);
    return data.user;
  }, []);

  // Used by flows where the server has already set the session cookie
  // (e.g. OAuth callback pages, register): re-hydrate the user from /auth/me.
  const restoreSession = useCallback(async () => {
    const me = await apiRequest("/auth/me", { noCache: true });
    setUser(me);
    return me;
  }, []);

  const signUp = useCallback(
    async ({ email, password, name }) => {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: name ?? (email.split("@")[0]?.trim() || "PharmaHub User"),
        }),
      });
      // If the server issued a session cookie, hydrate the user so the freshly
      // created account can go straight into onboarding (otherwise the onboarding
      // guard would bounce them back to /login).
      try {
        await restoreSession();
      } catch {
        // No session cookie set — user will sign in on their own.
      }
      return data;
    },
    [restoreSession],
  );

  // Final step of a Google sign-up: verify the emailed OTP, then the backend
  // creates the account and sets a fresh session cookie.
  const completeGoogleOtp = useCallback(async ({ token, code }) => {
    const data = await apiRequest("/auth/google/verify-otp", {
      method: "POST",
      body: JSON.stringify({ token, code }),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore — session is cleared locally regardless
    } finally {
      // Drop any cached /auth/me so a stale user never leaks into the next
      // sign-in / sign-up in this tab.
      clearCachedResponse("/auth/me");
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
        // UI still reflects the change.
        me = { ...(user || {}), ...body };
      }

      // The profile endpoint returns `{ user, profileCompletion }` — unwrap so
      // the context always holds the flat user object (with permissions, etc.)
      // and the sidebar/nav can read user.permissions immediately.
      if (me && typeof me === "object" && me.user && typeof me.user === "object") {
        me = me.user;
      }

      setUser(me);
      return me;
    },
    [user],
  );

  const requestPasswordReset = useCallback(async (email) => {
    await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, []);

  const resetPassword = useCallback(async ({ email, code, newPassword }) => {
    await apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    });
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
        resetPassword,
        setUser,
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
