import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Viewer = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  subscriptionStatus: string;
  accessExpiresAt: string | null;
  planCode: string | null;
  planName: string | null;
  permissions: string[];
  tradeAccount: 'EB' | 'DC' | null;
  accessActive: boolean;
};

type AuthState = {
  loading: boolean;
  configured: boolean;
  bootstrapRequired: boolean;
  user: Viewer | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  bootstrap: (setupKey: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

function permissionMatches(granted: string, required: string) {
  if (granted === '*' || granted === required) return true;
  if (granted.endsWith('.*')) return required.startsWith(granted.slice(0, -1));
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [bootstrapRequired, setBootstrapRequired] = useState(false);
  const [user, setUser] = useState<Viewer | null>(null);

  async function refresh() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      setConfigured(data.configured !== false);
      setBootstrapRequired(!!data.bootstrapRequired);
      setUser(data.authenticated ? data.user : null);
    } catch {
      setConfigured(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível entrar.');
    setUser(data.user ?? null);
    setBootstrapRequired(false);
  }

  async function bootstrap(setupKey: string, name: string, email: string, password: string) {
    const response = await fetch('/api/auth/bootstrap', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Setup-Key': setupKey },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível criar o administrador.');
    setUser(data.user ?? null);
    setBootstrapRequired(false);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    setUser(null);
    window.location.href = '/login';
  }

  const value = useMemo<AuthState>(() => ({
    loading,
    configured,
    bootstrapRequired,
    user,
    refresh,
    login,
    bootstrap,
    logout,
    hasPermission: (permission: string) => !!user && (user.role === 'admin' || user.permissions.some((granted) => permissionMatches(granted, permission))),
  }), [loading, configured, bootstrapRequired, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
