import prisma from '@/lib/prisma'

/**
 * Garante que `viewerId` tem permissão para visualizar o portfolio de `targetUserId`.
 *
 * Regras (ADR-0013, RN-11):
 * - Se viewerId === targetUserId → acesso imediato sem query (própria carteira).
 * - Se viewerId é LEADER em ao menos um Group do qual targetUserId é membro
 *   (qualquer papel) → acesso permitido (read-only).
 * - Qualquer outra combinação → lança Error('FORBIDDEN').
 *
 * Esta função é a única porta de entrada para leitura cross-user no sistema.
 * Nenhum handler pode ler dados de outro usuário sem chamá-la.
 */
export async function assertCanViewPortfolio(
  viewerId: string,
  targetUserId: string
): Promise<void> {
  // Caso trivial: usuário vendo sua própria carteira
  if (viewerId === targetUserId) return

  // Busca todos os grupos em que viewerId é LEADER
  const leaderMemberships = await prisma.groupMembership.findMany({
    where: { user_id: viewerId, role: 'LEADER' },
    select: { group_id: true },
  })

  if (leaderMemberships.length === 0) {
    throw new Error('FORBIDDEN')
  }

  const leaderGroupIds = leaderMemberships.map((m) => m.group_id)

  // Verifica se targetUserId é membro de ao menos um desses grupos
  const sharedGroup = await prisma.groupMembership.findFirst({
    where: {
      group_id: { in: leaderGroupIds },
      user_id: targetUserId,
    },
  })

  if (!sharedGroup) {
    throw new Error('FORBIDDEN')
  }
}
