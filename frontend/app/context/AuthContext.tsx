'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Buyer' | 'Problem Solver';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On every app load, restore the token from localStorage
   * then IMMEDIATELY validate it against the server's /api/auth/me endpoint.
   *
   * The server re-queries MongoDB for the latest role — so if an Admin
   * changed a user's role, or if someone tampered with cookies/localStorage,
   * the server response always wins.
   *
   * We NEVER store or trust the role from localStorage/cookies.
   * The only thing stored client-side is the JWT token itself,
   * which is cryptographically signed and cannot be forged without the JWT_SECRET.
   */
  const validateSession = useCallback(async (storedToken: string) => {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!res.ok) {
        // Token invalid / expired / user deleted → force logout
        clearSession();
        return;
      }

      const serverUser: User = await res.json();
      // Trust only the server response for the user's role
      setUser(serverUser);
      setToken(storedToken);

      // Keep the JWT cookie fresh for Next.js middleware (no role stored)
      document.cookie = `judy_token=${storedToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    } catch {
      // Network error — still load from token so the app doesn't break offline,
      // but the next API call will fail with 401 if the token is bad.
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const storedToken = localStorage.getItem('judy_token');
    if (storedToken) {
      validateSession(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [validateSession]);

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('judy_token');
    document.cookie = 'judy_token=; path=/; max-age=0';
    // Remove legacy role cookie if present from old sessions
    document.cookie = 'judy_role=; path=/; max-age=0';
  };

  const login = (userData: User, authToken: string) => {
    // userData comes directly from the server login response — it's trusted.
    // We only persist the JWT; the role is re-fetched from /me on next load.
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('judy_token', authToken);

    // JWT cookie for Next.js middleware — contains cryptographically signed data,
    // NOT a plain role string. Cannot be forged without the server's JWT_SECRET.
    document.cookie = `judy_token=${authToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

    // REMOVED: document.cookie = `judy_role=...` — this was the vulnerability.
    // Role is now always determined by the server, never by a cookie.
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
