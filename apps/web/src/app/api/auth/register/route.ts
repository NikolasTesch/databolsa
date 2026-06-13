import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json({ message: 'Email já cadastrado' }, { status: 400 });
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
