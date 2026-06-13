import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'Sem refresh token' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const response = NextResponse.json({ message: 'Refresh inválido' }, { status: 401 });
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }

  const data = (await res.json()) as { access_token: string; refresh_token: string };

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set('access_token', data.access_token, {
    ...COOKIE_OPTS,
    maxAge: 15 * 60,
  });
  response.cookies.set('refresh_token', data.refresh_token, {
    ...COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
