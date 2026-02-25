'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    const storedToken = localStorage.getItem('judy_token');
    const storedUser = localStorage.getItem('judy_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('judy_token', authToken);
    localStorage.setItem('judy_user', JSON.stringify(userData));
    // Set cookie for Next.js middleware (Edge runtime can't read localStorage)
    document.cookie = `judy_role=${userData.role}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    document.cookie = `judy_token=${authToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('judy_token');
    localStorage.removeItem('judy_user');
    document.cookie = 'judy_role=; path=/; max-age=0';
    document.cookie = 'judy_token=; path=/; max-age=0';
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
