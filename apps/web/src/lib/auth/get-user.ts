import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';

export async function getAuthUser(request: NextRequest): Promise<{ id: string; email: string } | null> {
  // 1. Tenta pegar do Header Authorization (Bearer)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (payload) {
      return { id: payload.sub, email: payload.email };
    }
  }

  // 2. Tenta pegar do Cookie access_token
  const cookieToken = request.cookies.get('access_token')?.value;
  if (cookieToken) {
    const payload = await verifyAccessToken(cookieToken);
    if (payload) {
      return { id: payload.sub, email: payload.email };
    }
  }

  return null;
}
