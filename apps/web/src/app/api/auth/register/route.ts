import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { jsonError } from '@/lib/http/errors';

const REGISTER_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`auth:register:${ip}`, REGISTER_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { message: 'Muitas tentativas. Tente novamente em breve.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'Payload inválido', 400);
  }

  const { email, password } = body;
  if (typeof email !== 'string' || !email.trim()) {
    return jsonError('INVALID_EMAIL', 'Email inválido', 400);
  }
  if (typeof password !== 'string' || password.length < 6) {
    return jsonError('INVALID_PASSWORD', 'Senha deve ter no mínimo 6 caracteres', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('INVALID_EMAIL', 'Formato de email inválido', 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return jsonError('DUPLICATE_EMAIL', 'Email já cadastrado', 409);
  }

  const password_hash = await bcryptjs.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password_hash },
  });

  const access_token = await signAccessToken({ sub: user.id, email: user.email });
  const refresh_token = await signRefreshToken({ sub: user.id, email: user.email });

  const refresh_token_hash = await bcryptjs.hash(refresh_token, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token_hash },
  });

  const response = NextResponse.json({ access_token, refresh_token }, { status: 201 });
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
