import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./db";
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
    if (id) window.localStorage.setItem(SESSION_KEY, id);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = readSession();
    if (id) {
      const found = db.get().profiles.find((p) => p.id === id) ?? null;
      setUser(found);
    }
    setLoading(false);
  }, []);
  const signIn = async (email) => {
    const found = db
      .get()
      .profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase() && p.active);
    if (!found) throw new Error("No account found for that email");
    writeSession(found.id);
    setUser(found);
    return found;
  };
  const signUp = async ({ name, email, orgName }) => {
    const existing = db
      .get()
      .profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) throw new Error("An account already exists with that email");
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
    setUser(null);
  };
  const switchRole = (role) => {
    if (!user) return;
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === user.id);
      if (p) p.role = role;
    });
    setUser({ ...user, role });
  };

  const requestPasswordReset = async () => {
    // Mock — always succeed
    await new Promise((r) => setTimeout(r, 400));
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error("Not signed in");
    await new Promise((r) => setTimeout(r, 350));
    // Verify current password: if a password is stored, check it; otherwise allow any value for demo accounts
    const profile = db.get().profiles.find((p) => p.id === user.id);
    if (profile?.password && profile.password !== currentPassword) {
      throw new Error("Incorrect current password");
    }
    // Save new password in the profile
    db.set((d) => {
      const p = d.profiles.find((x) => x.id === user.id);
      if (p) p.password = newPassword;
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

  const updateProfile = (updatedFields) => {
    if (!user) return null;
    let updatedUser = null;
    db.set((d) => {
      let p = d.profiles.find((x) => x.id === user.id);
      if (!p && d.profiles.length > 0) {
        // Fallback to active owner profile if user session is attached to default owner
        p = d.profiles[0];
      }
      if (p) {
        Object.assign(p, updatedFields);
        updatedUser = { ...p };
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
    const finalUser = updatedUser || { ...user, ...updatedFields };
    setUser(finalUser);
    return finalUser;
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
        requestPasswordReset,
        changePassword,
        updateProfile,
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
