'use client';

/**
 * SECURITY DESIGN:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. The ONLY thing stored client-side is the JWT token (localStorage + cookie).
 *    The JWT is cryptographically signed by the server secret — it cannot be
 *    forged or modified without the server invalidating it.
 *
 * 2. On EVERY app startup we:
 *    a. Immediately destroy any legacy `judy_role` plain-text cookie.
 *    b. Call GET /api/auth/me to get the REAL user + role from the database.
 *    c. Only set `user` state from the server response — NEVER from localStorage,
 *       cookies, or any other client-side source.
 *
 * 3. EVERY 401 / 403 response anywhere in the app calls `logout()` immediately.
 *    This prevents stale tokens or privilege-escalation attempts from persisting.
 *
 * 4. The session is re-validated whenever the user returns to the tab
 *    (document `visibilitychange` event) to catch server-side role changes.
 *
 * 5. NAV routing in DashboardLayout enforces role-based path access using
 *    the server-validated `user.role`, not any cookie or local storage value.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

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
  /** Call this from any component that gets a 401/403 from the backend */
  handleUnauthorized: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Nuke every cookie that could carry role/auth info client-side */
const wipeAuthCookies = (token?: string) => {
  // Always destroy the plain-text role cookie — this was the vulnerability
  document.cookie = 'judy_role=; path=/; max-age=0';
  // Refresh the JWT cookie if we have a valid token, otherwise clear it
  if (token) {
    document.cookie = `judy_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  } else {
    document.cookie = 'judy_token=; path=/; max-age=0';
  }
};

// ─── provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null); // sync ref for event handlers

  // ── core: ask the server who this token belongs to ──────────────────────
  const validateWithServer = useCallback(async (jwt: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
        // no-cache ensures we always get fresh data from the DB
        cache: 'no-store',
      });
      if (!res.ok) return null; // 401 expired / 403 forbidden / 404 deleted user
      return (await res.json()) as User;
    } catch {
      // Network down — we can't validate, treat as invalid for security
      return null;
    }
  }, []);

  // ── clear everything ─────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    localStorage.removeItem('judy_token');
    wipeAuthCookies(); // no token arg → clears judy_token too
  }, []);

  // ── called by any component that receives 401/403 from any API call ──────
  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  // ── startup: destroy legacy role cookie then validate token with server ──
  useEffect(() => {
    // STEP 1: Immediately nuke the plain-text judy_role cookie.
    //         This runs synchronously before any async work so it cannot be
    //         read by other code during the async validation phase.
    document.cookie = 'judy_role=; path=/; max-age=0';

    // STEP 2: Get the token from localStorage
    const storedToken = localStorage.getItem('judy_token');
    if (!storedToken) {
      setTimeout(() => setIsLoading(false), 0);
      return;
    }

    // STEP 3: Validate with server — role comes ONLY from /api/auth/me
    validateWithServer(storedToken).then((serverUser) => {
      if (serverUser) {
        setUser(serverUser);      // role is from DB, not from any local value
        setToken(storedToken);
        tokenRef.current = storedToken;
        wipeAuthCookies(storedToken); // keep JWT cookie fresh, role cookie gone
      } else {
        // Invalid / expired / deleted — force logout
        logout();
      }
      setIsLoading(false);
    });
  }, [validateWithServer, logout]);

  // ── re-validate when user switches back to this tab ──────────────────────
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const jwt = tokenRef.current;
      if (!jwt) return;

      const serverUser = await validateWithServer(jwt);
      if (serverUser) {
        // Silently update role in case admin changed it while tab was hidden
        setUser(serverUser);
      } else {
        logout();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [validateWithServer, logout]);

  // ── login: called immediately after a successful /api/auth/login response ─
  const login = useCallback((userData: User, authToken: string) => {
    // userData comes from the server's login response — it IS trusted here.
    // On the next app load, /api/auth/me will re-confirm the role from DB.
    setUser(userData);
    setToken(authToken);
    tokenRef.current = authToken;
    localStorage.setItem('judy_token', authToken);
    // Store only the JWT (signed) — never store the role in any cookie
    wipeAuthCookies(authToken);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, handleUnauthorized }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
