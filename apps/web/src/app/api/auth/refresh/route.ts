import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { jsonError } from '@/lib/http/errors';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  let refreshToken: string | undefined;

  // Tenta ler do body
  try {
    const body = await request.json();
    refreshToken = body?.refresh_token;
  } catch {
    // ignorar erro se for request de web sem body (usando cookie)
  }

  // Tenta ler do cookie
  if (!refreshToken) {
    refreshToken = request.cookies.get('refresh_token')?.value;
  }

  if (!refreshToken) {
    return jsonError('UNAUTHORIZED', 'Refresh token não fornecido', 401);
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return jsonError('UNAUTHORIZED', 'Token inválido ou expirado', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || !user.refresh_token_hash) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const valid = await bcryptjs.compare(refreshToken, user.refresh_token_hash);
  if (!valid) {
    return jsonError('UNAUTHORIZED', 'Token inválido ou expirado', 401);
  }

  const access_token = await signAccessToken({ sub: user.id, email: user.email });
  const refresh_token = await signRefreshToken({ sub: user.id, email: user.email });

  const refresh_token_hash = await bcryptjs.hash(refresh_token, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token_hash },
  });

  const response = NextResponse.json({ access_token, refresh_token }, { status: 200 });
  response.cookies.set('access_token', access_token, {
    ...COOKIE_OPTS,
    maxAge: 15 * 60, // 15 min
  });
  response.cookies.set('refresh_token', refresh_token, {
    ...COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  });

  return response;
}
