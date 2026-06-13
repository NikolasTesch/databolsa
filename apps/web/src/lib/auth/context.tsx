'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { loginBff, logoutBff, registerBff } from '@/lib/api/auth';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Otimismo: assumimos autenticado se há cookie (validado pelo middleware).
  // O estado aqui é só para forçar re-renders após login/logout.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const login = useCallback(async (email: string, password: string) => {
    await loginBff({ email, password });
    setIsAuthenticated(true);
    const next = new URLSearchParams(window.location.search).get('next');
    const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
    router.push(destination);
    router.refresh();
  }, [router]);

  const register = useCallback(async (email: string, password: string) => {
    await registerBff({ email, password });
    setIsAuthenticated(true);
    router.push('/dashboard');
    router.refresh();
  }, [router]);

  const logout = useCallback(async () => {
    await logoutBff();
    setIsAuthenticated(false);
    router.push('/login');
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return ctx;
}
