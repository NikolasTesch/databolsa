import { http, HttpResponse } from 'msw';
import type { PortfolioSummaryDto, Asset, Transaction } from '@/types/api';

const BASE = 'http://localhost:3000';

// --- Portfolio ---

export const portfolioSummaryHandler = http.get(`${BASE}/portfolio/summary`, () => {
  const body: PortfolioSummaryDto = {
    patrimonio_total_brl: '15000.00',
    positions: [
      {
        asset_id: 'asset-1',
        ticker: 'PETR4',
        current_quantity: '100',
        average_price: '30.00',
        invested_value: '3000.00',
        valor_atual_brl: '3500.00',
        lucro_prejuizo_brl: '500.00',
        lucro_prejuizo_pct: '16.67',
        alocacao_pct: '23.33',
        is_stale: false,
        current_price_brl: '35.00',
      },
      {
        asset_id: 'asset-2',
        ticker: 'VALE3',
        current_quantity: '50',
        average_price: '80.00',
        invested_value: '4000.00',
        valor_atual_brl: '3800.00',
        lucro_prejuizo_brl: '-200.00',
        lucro_prejuizo_pct: '-5.00',
        alocacao_pct: '25.33',
        is_stale: false,
        current_price_brl: '76.00',
      },
      {
        asset_id: 'asset-3',
        ticker: 'BTCUSDT',
        current_quantity: '0.5',
        average_price: '150000.00',
        invested_value: '75000.00',
        valor_atual_brl: '7700.00',
        lucro_prejuizo_brl: '700.00',
        lucro_prejuizo_pct: '9.09',
        alocacao_pct: '51.33',
        is_stale: true,
        current_price_brl: null,
      },
    ],
  };
  return HttpResponse.json(body);
});

export const portfolioSummaryWithNullHandler = http.get(
  `${BASE}/portfolio/summary`,
  () => {
    const body: PortfolioSummaryDto = {
      patrimonio_total_brl: '0.00',
      positions: [
        {
          asset_id: 'asset-no-quote',
          ticker: 'UNKNOWN',
          current_quantity: '10',
          average_price: '50.00',
          invested_value: '500.00',
          valor_atual_brl: null,
          lucro_prejuizo_brl: null,
          lucro_prejuizo_pct: null,
          alocacao_pct: null,
          is_stale: false,
          current_price_brl: null,
        },
      ],
    };
    return HttpResponse.json(body);
  },
);

// --- Assets ---

export const assetsHandler = http.get(`${BASE}/assets`, () => {
  const body: Asset[] = [
    {
      id: 'asset-1',
      user_id: 'user-1',
      ticker: 'PETR4',
      name: 'Petrobras PN',
      asset_class: 'STOCK_BR',
      currency: 'BRL',
      data_source: 'BRAPI',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];
  return HttpResponse.json(body);
});

// --- Transactions ---

export const transactionsHandler = (assetId: string) =>
  http.get(`${BASE}/assets/${assetId}/transactions`, () => {
    const body: Transaction[] = [
      {
        id: 'tx-1',
        asset_id: assetId,
        type: 'BUY',
        date: '2024-01-15',
        unit_price: '30.00',
        quantity: '100',
        fees: '0.50',
        created_at: '2024-01-15T00:00:00.000Z',
        updated_at: '2024-01-15T00:00:00.000Z',
      },
    ];
    return HttpResponse.json(body);
  });

export const transactionCreate422Handler = (assetId: string) =>
  http.post(`${BASE}/assets/${assetId}/transactions`, () => {
    return HttpResponse.json(
      { statusCode: 422, message: 'Quantidade de venda excede a posição atual', error: 'Unprocessable Entity' },
      { status: 422 },
    );
  });

// --- Auth ---

export const loginHandler = http.post('/api/session/login', async ({ request }) => {
  const body = (await request.json()) as { email: string; password: string };
  if (body.email === 'test@example.com' && body.password === 'password123') {
    return HttpResponse.json({ ok: true });
  }
  return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
});

export const handlers = [
  portfolioSummaryHandler,
  assetsHandler,
  loginHandler,
];
