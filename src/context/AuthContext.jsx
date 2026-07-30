import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS, ROLE_DEFAULT_ROUTES } from '../constants/roles';

const AuthContext = createContext(null);
const STORAGE_KEY = 'pharmahub_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    // Simulate slight async network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (password !== '123456') {
      setLoading(false);
      return { success: false, error: 'Invalid password. Hint: Password is 123456' };
    }

    const matchedUser = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!matchedUser) {
      setLoading(false);
      return { success: false, error: 'User account not found. Try one of the demo emails.' };
    }

    const userSession = {
      ...matchedUser,
      loggedInAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userSession));
    } catch (e) {
      console.error('Failed to save auth session to localStorage', e);
    }

    setUser(userSession);
    setLoading(false);

    const redirectPath = ROLE_DEFAULT_ROUTES[matchedUser.role] || '/dashboard';
    return { success: true, user: userSession, redirectPath };
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear auth session from localStorage', e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
