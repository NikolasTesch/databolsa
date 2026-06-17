// @vitest-environment node
import { NextRequest } from 'next/server';
import { POST as registerPost } from '@/app/api/auth/register/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { GET as assetsGet, POST as assetsPost } from '@/app/api/assets/route';
import { GET as summaryGet } from '@/app/api/portfolio/summary/route';
import prisma from '@/lib/prisma';
import { QuoteService } from '@/lib/quotes/quote.service';
import { signAccessToken } from '@/lib/auth/jwt';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    asset: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/quotes/quote.service', () => {
  const { Decimal } = require('decimal.js');
  const mockGetQuote = vi.fn().mockResolvedValue({
    priceBrl: new Decimal('100'),
    isStale: false,
  });
  const mockInstance = { getQuote: mockGetQuote };
  return {
    QuoteService: vi.fn().mockImplementation(() => mockInstance),
    // singleton exportado — usado por positions.ts como defaultQuoteService
    quoteService: mockInstance,
  };
});

describe('Route Handlers API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Padrão: getAuthUser precisa de user.findUnique para carregar role (SPEC-0037)
    (prisma.user.findUnique as any).mockResolvedValue({ role: 'USER' });
  });

  describe('POST /api/auth/register', () => {
    it('retorna 400 se faltar credenciais', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await registerPost(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toContain('Email e senha são obrigatórios');
    });

    it('registra novo usuário com sucesso', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password_hash: 'hash',
      });
      (prisma.user.update as any).mockResolvedValue({});

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });
      const res = await registerPost(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.access_token).toBeDefined();
      expect(body.refresh_token).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('retorna 401 para credenciais inválidas', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });
      const res = await loginPost(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toContain('Credenciais inválidas');
    });
  });

  describe('GET /api/assets', () => {
    it('retorna 401 se não autenticado', async () => {
      const req = new NextRequest('http://localhost:3000/api/assets');
      const res = await assetsGet(req);
      expect(res.status).toBe(401);
    });

    it('retorna ativos do usuário autenticado', async () => {
      const token = await signAccessToken({ sub: 'user-1', email: 'test@example.com' });
      const mockAssets = [{ id: 'asset-1', ticker: 'PETR4', name: 'Petrobras' }];
      (prisma.asset.findMany as any).mockResolvedValue(mockAssets);

      const req = new NextRequest('http://localhost:3000/api/assets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await assetsGet(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockAssets);
    });
  });

  describe('GET /api/portfolio/summary', () => {
    it('retorna o resumo do portfolio consolidado', async () => {
      const token = await signAccessToken({ sub: 'user-1', email: 'test@example.com' });
      const mockAssets = [
        {
          id: 'asset-1',
          ticker: 'PETR4',
          asset_class: 'STOCK_BR',
          currency: 'BRL',
          transactions: [
            {
              type: 'BUY',
              date: new Date('2026-01-01'),
              unit_price: '30.0',
              quantity: '10.0',
              fees: '0.0',
            },
          ],
        },
      ];
      (prisma.asset.findMany as any).mockResolvedValue(mockAssets);

      const req = new NextRequest('http://localhost:3000/api/portfolio/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await summaryGet(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.patrimonio_total_brl).toBeDefined();
      expect(body.positions).toHaveLength(1);
      expect(body.positions[0].ticker).toBe('PETR4');
    });
  });
});
