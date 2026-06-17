import { NextRequest } from 'next/server';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

interface WindowState {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowState>();

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  if (process.env.NODE_ENV === 'test') {
    return { allowed: true, retryAfterSec: 0 };
  }

  const now = Date.now();
  const state = store.get(key);

  if (!state || now >= state.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (state.count < options.limit) {
    state.count++;
    return { allowed: true, retryAfterSec: 0 };
  }

  return {
    allowed: false,
    retryAfterSec: Math.ceil((state.resetAt - now) / 1000),
  };
}

export function getClientIp(request: NextRequest): string {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
  } catch {
    // request may be undefined in internal server-side calls
  }
  return '127.0.0.1';
}
