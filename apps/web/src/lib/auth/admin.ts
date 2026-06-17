import prisma from '@/lib/prisma'

/**
 * Garante que `userId` possui papel global ADMIN.
 *
 * Regras (ADR-0013, RN-11):
 * - Se o usuário tem `role === 'ADMIN'` → retorna sem erro.
 * - Se o usuário tem `role === 'USER'` ou não existe → lança Error('FORBIDDEN').
 *
 * O papel ADMIN é global e separado do papel por-grupo (LEADER/MEMBER).
 * Um ADMIN não tem acesso automático à carteira de usuários — para isso
 * precisaria também ser LEADER do grupo via assertCanViewPortfolio.
 */
export async function assertIsAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN')
  }
}
