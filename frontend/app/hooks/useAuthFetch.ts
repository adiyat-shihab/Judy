/**
 * authFetch — a thin wrapper around fetch() that:
 *
 * 1. Automatically attaches the Authorization: Bearer <token> header
 * 2. On 401 (Unauthorized) or 403 (Forbidden) responses, immediately calls
 *    `handleUnauthorized()` which logs the user out and clears all local state.
 *
 * Every component that talks to the backend MUST use this instead of bare fetch()
 * so that privilege escalation attempts or expired tokens are caught instantly,
 * not silently ignored.
 *
 * Usage:
 *   const { authFetch } = useAuthFetch();
 *   const data = await authFetch('/api/projects');
 */

import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useAuthFetch() {
  const { token, handleUnauthorized } = useAuth();

  const authFetch = useCallback(
    async (
      path: string,
      options: RequestInit = {}
    ): Promise<Response> => {
      const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

      // Any 401 or 403 from the server means the token is invalid or the user
      // does not have permission → force logout immediately.
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
      }

      return res;
    },
    [token, handleUnauthorized]
  );

  return { authFetch };
}
