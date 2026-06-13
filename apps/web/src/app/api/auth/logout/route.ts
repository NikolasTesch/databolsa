import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token_hash: null },
    });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  return response;
}
