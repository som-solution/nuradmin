import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminLoginResponse, type AdminType } from '../lib/adminApi';

interface AdminUser {
  adminId: string;
  email: string;
  adminType: AdminType;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const ADMIN_TOKEN_KEY = 'adminAccessToken';
const ADMIN_REFRESH_KEY = 'adminRefreshToken';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applyLoginResponse = useCallback((data: AdminLoginResponse) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, data.accessToken);
    localStorage.setItem(ADMIN_REFRESH_KEY, data.refreshToken ?? '');
    setAdmin({
      adminId: data.adminId,
      email: data.email,
      adminType: data.adminType,
    });
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refresh = localStorage.getItem(ADMIN_REFRESH_KEY);
    if (!refresh) {
      setAdmin(null);
      setLoading(false);
      return false;
    }
    try {
      const data = await adminApi.post<AdminLoginResponse>('/auth/refresh', { refreshToken: refresh });
      applyLoginResponse(data);
      return true;
    } catch {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_REFRESH_KEY);
      setAdmin(null);
      return false;
    }
  }, [applyLoginResponse]);

  // On mount: restore session from stored token (refresh) or clear and stop loading
  /* eslint-disable react-hooks/set-state-in-effect -- session restore: setState in async callback is intentional */
  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      queueMicrotask(() => {
        setAdmin(null);
        setLoading(false);
      });
      return;
    }
    let cancelled = false;
    refreshToken()
      .then(() => { if (!cancelled) setLoading(false); })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await adminApi.post<AdminLoginResponse>('/auth/login', { email, password });
      applyLoginResponse(data);
    },
    [applyLoginResponse]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_KEY);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, loading, login, logout, refreshToken }),
    [admin, loading, login, logout, refreshToken]
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components -- hook must be next to provider for context */
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
