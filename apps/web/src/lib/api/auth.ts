import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api';

/**
 * Chama o BFF interno do Next.js (não o backend diretamente).
 * O BFF grava os tokens em cookies httpOnly.
 */
export async function loginBff(data: LoginRequest): Promise<void> {
  const res = await fetch('/api/session/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = { message: res.statusText };
    }
    const msg =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
}

export async function registerBff(data: RegisterRequest): Promise<void> {
  const res = await fetch('/api/session/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = { message: res.statusText };
    }
    const msg =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
}

export async function logoutBff(): Promise<void> {
  await fetch('/api/session/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function refreshBff(): Promise<AuthResponse | null> {
  const res = await fetch('/api/session/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}
