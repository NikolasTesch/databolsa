/**
 * Helper centralizado para chamadas à API do CoinGecko.
 *
 * Injeta automaticamente o header `x-cg-demo-api-key` quando a variável
 * de ambiente COINGECKO_API_KEY estiver configurada (Opção B — Demo Key gratuita).
 * Sem a chave, funciona no modo público (Opção A), com rate limit compartilhado por IP.
 *
 * Como obter a Demo Key (gratuita, sem cartão):
 *   https://www.coingecko.com/en/api/pricing → "Demo Plan (Free)"
 */

const BASE_URL = 'https://api.coingecko.com/api/v3';

function getCoinGeckoHeaders(): HeadersInit {
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    return { 'x-cg-demo-api-key': apiKey };
  }
  return {};
}

/**
 * Faz um fetch autenticado à API pública do CoinGecko.
 * Passa o header da Demo Key automaticamente se COINGECKO_API_KEY estiver definida.
 */
export async function coinGeckoFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  return fetch(url, {
    signal: AbortSignal.timeout(5000),
    ...options,
    headers: {
      ...getCoinGeckoHeaders(),
      ...(options?.headers ?? {}),
    },
  });
}
