'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useBaseUrl } from './base-url';
import type { MomoHourPermission } from './types';

export interface MomoHourSession {
  token: string;
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
  permissions: MomoHourPermission[];
}

interface AuthContextValue {
  session: MomoHourSession | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (permission: MomoHourPermission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// api.ts's postJson isn't a React component/hook, so it can't call
// useAuth() - it reads this module-level mirror instead, kept in sync by
// the provider below. Still never touches disk/localStorage - a plain JS
// variable that resets on reload, same reasoning the old admin key had
// (docus/MOMO-HOUR-RBAC.md §5): this authorizes real changes, so it isn't
// worth persisting.
let currentSession: MomoHourSession | null = null;

export function getCurrentSession(): MomoHourSession | null {
  return currentSession;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { baseUrl } = useBaseUrl();
  const [session, setSession] = useState<MomoHourSession | null>(null);

  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/momo-hour/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', metadata: '{}' },
        body: JSON.stringify({ email, password })
      });
    } catch (error) {
      return { ok: false, message: `Could not reach ${baseUrl} - ${(error as Error).message}` };
    }

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // leave null
    }

    const body = data as { success?: boolean; token?: string; user?: Omit<MomoHourSession, 'token'>; reason?: string } | null;
    if (!res.ok || !body?.success || !body.token || !body.user) {
      return { ok: false, message: 'Incorrect email or password.' };
    }

    const newSession: MomoHourSession = { token: body.token, ...body.user };
    currentSession = newSession;
    setSession(newSession);
    return { ok: true };
  };

  const logout = () => {
    currentSession = null;
    setSession(null);
  };

  const hasPermission = (permission: MomoHourPermission) =>
    !!session && (session.isSuperAdmin || session.permissions.includes(permission));

  return (
    <AuthContext.Provider value={{ session, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
