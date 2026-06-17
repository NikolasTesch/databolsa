/**
 * Helper padronizado de resposta de erro para Route Handlers.
 *
 * Formato: { message: string, error: { code: string } }
 *
 * `message` fica no topo por compatibilidade com clientes que já lêem
 * apenas esse campo (ver ADR-0013).
 *
 * @param code   Código de máquina em UPPER_SNAKE_CASE (ex.: "NOT_FOUND")
 * @param message Texto legível em pt-BR para exibição ao usuário
 * @param status  HTTP status code
 */
export function jsonError(
  code: string,
  message: string,
  status: number,
): Response {
  return Response.json({ message, error: { code } }, { status });
}
