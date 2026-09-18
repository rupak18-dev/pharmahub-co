import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./db";
import { getAuthToken, setAuthToken } from "./api";
import { authService, isNetworkError } from "./authService";

const SESSION_KEY = "PharmaHub_session_v1";

const AuthContext = createContext(null);

function readSession() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(id) {
  if (typeof window === "undefined") return;

  try {
    if (id) {
      window.localStorage.setItem(SESSION_KEY, id);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const PROFILE_FIELDS = [
  "name",
  "email",
  "phone",
  "avatarUrl",
  "role",
  "active",
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
  "permissions",
  "featureAccess",
  "accessIds",
  "department",
  "designation",
  "profileCompletion",
];

// Mirror a backend user into the local profile collection. When a local
// profile already exists for the same email (case-insensitive), its id is
// kept so existing sessions stay valid; otherwise the stable backend Mongo
// id is used so the profile survives reloads.
function upsertBackendUser(backendUser) {
  if (!backendUser?.email) return null;

  const normalized = backendUser.email.trim().toLowerCase();
  db.set((d) => {
    const existing = d.profiles.find((p) => p.email && p.email.trim().toLowerCase() === normalized);

    const profile = existing ?? {
      id: backendUser.id,
      status: "active",
      createdAt: backendUser.createdAt || new Date().toISOString(),
    };

    for (const key of PROFILE_FIELDS) {
      if (backendUser[key] !== undefined) profile[key] = backendUser[key];
    }

    profile.active = backendUser.active ?? true;
    if (backendUser.role) profile.role = backendUser.role;

    if (!existing) {
      d.profiles.push(profile);
    }
  });

  return (
    db.get().profiles.find((p) => p.email && p.email.trim().toLowerCase() === normalized) ?? null
  );
}

function findLocalProfile(email) {
  const normalized = (email || "").trim().toLowerCase();
  return (
    db
      .get()
      .profiles.find(
        (p) => p.email && p.email.toLowerCase() === normalized && p.active !== false,
      ) ?? null
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const id = readSession();

    const finish = (profile) => {
      if (cancelled) return;
      setUser(profile);
      setLoading(false);
    };

    const clearSession = () => {
      writeSession(null);
      setAuthToken(null);
      if (!cancelled) {
        setUser(null);
        setLoading(false);
      }
    };

    if (!id) {
      setLoading(false);
      return undefined;
    }

    const found = db.get().profiles.find((profile) => profile.id === id) ?? null;

    // A local-only session (no backend token) can never authenticate against
    // the API, so treat it as signed out rather than silently loading a fake
    // profile that 401s every request.
    if (!getAuthToken()) {
      clearSession();
      return undefined;
    }

    // Validate the stored token against the backend. A non-network error
    // (401/500) means the session is invalid/expired → sign out. A network
    // error means the backend is unreachable → keep the local profile.
    authService
      .getMe()
      .then((data) => {
        if (cancelled) return;
        const backendUser = data?.user ?? data;
        const profile = backendUser?.email ? upsertBackendUser(backendUser) : found;
        if (profile?.id && profile.id !== id) writeSession(profile.id);
        finish(profile);
      })
      .catch((error) => {
        if (cancelled) return;
        if (isNetworkError(error)) {
          finish(found);
        } else {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Any component can dispatch `pharmahub:unauthorized` when the backend
  // returns 401 mid-session (e.g. an expired token) — sign out cleanly so
  // protected routes redirect to the login page.
  useEffect(() => {
    const onUnauthorized = () => {
      writeSession(null);
      setAuthToken(null);
      setUser(null);
    };
    window.addEventListener("pharmahub:unauthorized", onUnauthorized);
    return () => window.removeEventListener("pharmahub:unauthorized", onUnauthorized);
  }, []);

  // When the browser tab becomes visible again, refresh the user object from
  // the backend so role / permission / access changes made by an admin are
  // reflected without requiring a manual page reload or re-login.
  useEffect(() => {
    if (!user) return;

    const refreshUser = async () => {
      try {
        const data = await authService.getMe();
        const backendUser = data?.user ?? data;
        if (backendUser?.email) {
          const mirrored = upsertBackendUser(backendUser);
          setUser(mirrored ?? backendUser);
        }
      } catch {
        // Silently ignore — stale data persists until next full reload.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUser();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [user?.id]);

  const signInWithUser = ({ token, user: backendUser }) => {
    setAuthToken(token);
    const mirrored = upsertBackendUser(backendUser);
    const sessionProfile = mirrored ?? findLocalProfile(backendUser?.email);

    if (sessionProfile) {
      writeSession(sessionProfile.id);
      setUser(sessionProfile);
      return sessionProfile;
    }

    setUser(backendUser ?? null);
    return backendUser ?? null;
  };

  // Backend-first sign-in. The backend is authoritative for credentials; the
  // local database is used ONLY when the backend is unreachable (network
  // error), never when it returns a 401/403.
  const signIn = async (email, password) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized) throw new Error("Enter an email address");

    try {
      const data = await authService.login({ email, password });
      return signInWithUser(data);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }

      const found = findLocalProfile(normalized);
      if (!found) throw new Error("No account found for that email");

      if (found.password && found.password !== password) {
        throw new Error("Invalid email or password");
      }

      writeSession(found.id);
      setUser(found);
      return found;
    }
  };

  const signUp = async ({ name, email, orgName }) => {
    const existing = db
      .get()
      .profiles.find((profile) => profile.email.toLowerCase() === email.trim().toLowerCase());

    if (existing) {
      throw new Error("An account already exists with that email");
    }

    const profile = {
      id: db.uid(),
      name,
      email,
      role: "Owner",
      active: true,
      orgName,
      createdAt: new Date().toISOString(),
    };

    db.set((d) => {
      d.profiles.push(profile);

      d.activityLogs.unshift({
        id: db.uid(),
        userId: profile.id,
        userName: profile.name,
        action: "Signed up",
        entityType: "auth",
        createdAt: new Date().toISOString(),
      });
    });

    writeSession(profile.id);
    setUser(profile);

    return profile;
  };

  const signOut = () => {
    writeSession(null);
    setAuthToken(null);
    setUser(null);
  };

  const switchRole = (role) => {
    if (!user) return;

    db.set((d) => {
      const profile = d.profiles.find((item) => item.id === user.id);

      if (profile) {
        profile.role = role;
      }
    });

    setUser({
      ...user,
      role,
    });
  };

  const requestPasswordReset = async (email) => {
    try {
      await authService.requestPasswordReset(email);
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) {
      throw new Error("Not signed in");
    }

    try {
      await authService.changePassword({ currentPassword, newPassword });
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      const profile = db.get().profiles.find((item) => item.id === user.id);

      if (!profile) {
        throw new Error("User profile not found");
      }

      if (profile.password && profile.password !== currentPassword) {
        throw new Error("Incorrect current password");
      }
    }

    db.set((d) => {
      const currentProfile = d.profiles.find((item) => item.id === user.id);

      if (currentProfile) {
        currentProfile.password = newPassword;
        currentProfile.passwordChangedAt = new Date().toISOString();
      }

      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: "Changed password",
        entityType: "auth",
        createdAt: new Date().toISOString(),
      });
    });
  };

  const updateProfile = async (updatedFields) => {
    if (!user) {
      return null;
    }

    try {
      const data = await authService.updateMyProfile(updatedFields);
      if (data?.user) {
        upsertBackendUser({
          ...data.user,
          profileCompletion: data.profileCompletion ?? data.user.profileCompletion,
        });
      }
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }

    let updatedUser = null;

    db.set((d) => {
      const profile = d.profiles.find((item) => item.id === user.id);

      if (profile) {
        Object.assign(profile, updatedFields);
        updatedUser = { ...profile };
      }

      d.activityLogs.unshift({
        id: db.uid(),
        userId: user.id,
        userName: user.name,
        action: "Updated profile details",
        entityType: "profile",
        createdAt: new Date().toISOString(),
      });
    });

    const finalUser = updatedUser || {
      ...user,
      ...updatedFields,
    };

    setUser(finalUser);

    return finalUser;
  };

  // Applies an uploaded avatar returned by the backend (a permanent URL) to
  // the auth state and the local mirror. The backend is the source of truth —
  // only the URL it returns is ever stored, never a blob/object URL.
  const applyAvatar = (backendUser) => {
    if (!backendUser?.email) return null;
    const mirrored = upsertBackendUser(backendUser);
    if (mirrored) {
      setUser(mirrored);
      return mirrored;
    }
    setUser(backendUser);
    return backendUser;
  };

  const uploadAvatar = async (file) => {
    if (!user) return null;
    const data = await authService.uploadAvatar(file);
    return applyAvatar({
      ...(data?.user ?? {}),
      profileCompletion: data?.profileCompletion ?? data?.user?.profileCompletion,
    });
  };

  const removeAvatar = async () => {
    if (!user) return null;
    const data = await authService.removeAvatar();
    return applyAvatar({
      ...(data?.user ?? {}),
      profileCompletion: data?.profileCompletion ?? data?.user?.profileCompletion,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithUser,
        signUp,
        signOut,
        switchRole,
        requestPasswordReset,
        changePassword,
        updateProfile,
        uploadAvatar,
        removeAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
