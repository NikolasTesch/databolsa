import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import prisma from '@/lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

/**
 * Extrai e valida o JWT da requisição (Authorization Bearer ou cookie access_token).
 * Retorna o usuário autenticado com seu papel global (`role`), ou null se não autenticado.
 *
 * O campo `role` é carregado do banco para evitar query extra nos guards de admin
 * (assertIsAdmin pode confiar no valor retornado aqui sem nova consulta).
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  let sub: string | null = null;
  let email: string | null = null;

  // 1. Tenta pegar do Header Authorization (Bearer)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (payload) {
      sub = payload.sub;
      email = payload.email;
    }
  }

  // 2. Tenta pegar do Cookie access_token
  if (!sub) {
    const cookieToken = request.cookies.get('access_token')?.value;
    if (cookieToken) {
      const payload = await verifyAccessToken(cookieToken);
      if (payload) {
        sub = payload.sub;
        email = payload.email;
      }
    }
  }

  if (!sub || !email) return null;

  // Carrega o role do banco junto com a validação do JWT para confirmar que
  // o usuário ainda existe e obter seu papel global atual. Nota: assertIsAdmin
  // realiza sua própria query para obter o role mais recente do banco — o valor
  // aqui serve apenas para retorno tipado ao caller, não elimina aquela query.
  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: { role: true },
  });

  if (!user) return null;

  return { id: sub, email, role: user.role };
}
