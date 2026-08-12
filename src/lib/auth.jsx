import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const TOKEN_KEY = "ph_token";
const AuthContext = createContext(null);

function readSession() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeSession(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = readSession();
      if (token) {
        try {
          const res = await api.get("/auth/me");
          if (res && res.success) {
            setUser(res.data);
          } else {
            writeSession(null);
          }
        } catch (err) {
          writeSession(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const signIn = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res && res.success && res.data?.token) {
      writeSession(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res?.message || "Login failed");
  };

  const signUp = async ({ name, email, orgName, password }) => {
    // Note: the backend register schema requires a password.
    // If the mock UI doesn't provide it, we might need a default or update the UI.
    const res = await api.post("/auth/register", { 
      name, 
      email, 
      orgName, 
      password: password || "password123", // fallback just in case
      role: "Owner" 
    });
    
    if (res && res.success && res.data?.token) {
      writeSession(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res?.message || "Registration failed");
  };

  const signOut = () => {
    writeSession(null);
    setUser(null);
  };

  const switchRole = (role) => {
    if (!user) return;
    // For mock purposes if backend doesn't support immediate role switch
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
