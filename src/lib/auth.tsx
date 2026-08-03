import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { db } from "./db";
import type { Profile, RoleName } from "./types";

const SESSION_KEY = "PharmaHub_session_v1";

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Profile>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    orgName: string;
  }) => Promise<Profile>;
  signOut: () => void;
  switchRole: (role: RoleName) => void;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(SESSION_KEY, id);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = readSession();
    if (id) {
      const found = db.get().profiles.find((p) => p.id === id) ?? null;
      setUser(found);
    }
    setLoading(false);
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email) => {
    const found = db
      .get()
      .profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase() && p.active);
    if (!found) throw new Error("No account found for that email");
    writeSession(found.id);
    setUser(found);
    return found;
  };

  const signUp: AuthContextValue["signUp"] = async ({ name, email, orgName }) => {
    const existing = db
      .get()
      .profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) throw new Error("An account already exists with that email");
    const profile: Profile = {
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

  const switchRole = (role: RoleName) => {
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

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, switchRole, requestPasswordReset }}
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
