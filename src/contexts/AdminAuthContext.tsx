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

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    // We don't have a "me" endpoint for admin; trust stored token and try refresh to get adminId/adminType
    refreshToken().finally(() => setLoading(false));
  }, [refreshToken]);

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

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
