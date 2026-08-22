import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Session lives in an httpOnly cookie — hydrate the user from the
      // server. Nothing about auth is persisted client-side.
      try {
        const me = await apiRequest("/auth/me");
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

  const signUp = useCallback(async ({ email, password, name }) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        name: name ?? (email.split("@")[0]?.trim() || "PharmaHub User"),
      }),
    });
    return data;
  }, []);

  // Used by flows where the server has already set the session cookie
  // (e.g. OAuth callback pages): re-hydrate the user from /auth/me.
  const restoreSession = useCallback(async () => {
    const me = await apiRequest("/auth/me");
    setUser(me);
    return me;
  }, []);

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
        switchRole,
        updateProfile,
        restoreSession,
        completeGoogleOtp,
        requestPasswordReset,
        resetPassword,
        demoLoginRequest,
        demoLoginVerify,
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
