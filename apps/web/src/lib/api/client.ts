/**
 * Fetch wrapper centralizado.
 * - Injeta o access_token do cookie nas chamadas server-side.
 * - No browser, as chamadas para `/api/*` (BFF) usam cookies automaticamente.
 * - Detecta 401 no browser → tenta refresh via /api/session/refresh → repete.
 */

const API_URL =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:3000')
    : '';

/** Endpoints que são tratados como BFF no browser */
function isBffPath(path: string): boolean {
  return path.startsWith('/api/session/');
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${status}`;
    super(message);
    this.name = 'ApiClientError';
  }
}

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

async function performRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/session/refresh', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

async function drainRefreshQueue(ok: boolean) {
  refreshQueue.forEach((cb) => cb(ok));
  refreshQueue = [];
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  /** Access token para chamadas server-side (lido dos cookies pelo caller) */
  accessToken?: string,
  _retried?: boolean,
): Promise<T> {
  const isServer = typeof window === 'undefined';

  const url = isServer
    ? path.startsWith('/api/') ? `${API_URL}${path}` : `${API_URL}/api${path}`
    : path.startsWith('/api/') ? path : `/api${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (isServer && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // 401 no browser: tentar refresh automático uma vez
  if (!isServer && res.status === 401 && !isBff) {
    if (_retried) {
      throw new ApiClientError(401, { message: 'Sessão expirada' });
    }

    if (isRefreshing) {
      // Já está renovando — esperar na fila
      const ok = await new Promise<boolean>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (!ok) throw new ApiClientError(401, { message: 'Sessão expirada' });
      return apiFetch<T>(path, options, undefined, true);
    }

    isRefreshing = true;
    const ok = await performRefresh();
    isRefreshing = false;
    drainRefreshQueue(ok);

    if (!ok) throw new ApiClientError(401, { message: 'Sessão expirada' });
    return apiFetch<T>(path, options, undefined, true);
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = { message: res.statusText };
    }
    throw new ApiClientError(res.status, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}
