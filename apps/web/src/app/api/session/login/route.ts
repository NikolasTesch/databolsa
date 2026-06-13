import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = { message: res.statusText };
    }
    return NextResponse.json(errBody, { status: res.status });
  }

  const data = (await res.json()) as { access_token: string; refresh_token: string };

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set('access_token', data.access_token, {
    ...COOKIE_OPTS,
    maxAge: 15 * 60, // 15 min
  });
  response.cookies.set('refresh_token', data.refresh_token, {
    ...COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  });

  return response;
}
