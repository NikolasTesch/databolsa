// @vitest-environment node
/**
 * SPEC-0016 — TC-01, TC-02, TC-04
 * Tests for GET /api/market/news with Finnhub mocked via vi.mock
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the news service so we control what fetchGeneralNews / fetchTickerNews return
vi.mock('@/lib/news/news.service', () => {
  const MOCK_ARTICLES = [
    {
      id: '1',
      title: 'Test Article 1',
      summary: 'Summary 1',
      source: 'Reuters',
      url: 'https://reuters.com/1',
      imageUrl: 'https://example.com/img1.jpg',
      publishedAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: '2',
      title: 'PETR4 earnings beat expectations',
      summary: 'Petrobras reported strong Q2 results.',
      source: 'Bloomberg',
      url: 'https://bloomberg.com/2',
      imageUrl: null,
      publishedAt: '2026-06-14T09:00:00.000Z',
    },
  ];

  return {
    fetchGeneralNews: vi.fn().mockResolvedValue({ articles: MOCK_ARTICLES, cached: false }),
    fetchTickerNews: vi.fn().mockResolvedValue({ articles: MOCK_ARTICLES, cached: false }),
  };
});

import { fetchGeneralNews, fetchTickerNews } from '@/lib/news/news.service';
import { GET } from '@/app/api/market/news/route';

const mockFetchGeneralNews = fetchGeneralNews as ReturnType<typeof vi.fn>;
const mockFetchTickerNews = fetchTickerNews as ReturnType<typeof vi.fn>;

const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Test Article 1',
    summary: 'Summary 1',
    source: 'Reuters',
    url: 'https://reuters.com/1',
    imageUrl: 'https://example.com/img1.jpg',
    publishedAt: '2026-06-14T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'PETR4 earnings beat expectations',
    summary: 'Petrobras reported strong Q2 results.',
    source: 'Bloomberg',
    url: 'https://bloomberg.com/2',
    imageUrl: null,
    publishedAt: '2026-06-14T09:00:00.000Z',
  },
];

const FALLBACK_ARTICLES = [
  {
    id: 'fallback-1',
    title: 'Fallback Article',
    summary: 'Static fallback content.',
    source: 'DataBolsa Editorial',
    url: 'https://www.b3.com.br/',
    imageUrl: null,
    publishedAt: '2026-06-10T12:00:00.000Z',
  },
];

describe('TC-01 — GET /api/market/news: retorno normalizado sem q param', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchGeneralNews.mockResolvedValue({ articles: MOCK_ARTICLES, cached: false });
    mockFetchTickerNews.mockResolvedValue({ articles: MOCK_ARTICLES, cached: false });
  });

  it('retorna 200 com lista de notícias normalizadas', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.news).toBeDefined();
    expect(Array.isArray(body.news)).toBe(true);
    expect(body.cached).toBe(false);
  });

  it('cada artigo tem os campos obrigatórios: id, title, summary, source, url, imageUrl, publishedAt', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news');
    const res = await GET(req);
    const body = await res.json();

    const article = body.news[0];
    expect(article).toHaveProperty('id');
    expect(article).toHaveProperty('title');
    expect(article).toHaveProperty('summary');
    expect(article).toHaveProperty('source');
    expect(article).toHaveProperty('url');
    expect(article).toHaveProperty('imageUrl');
    expect(article).toHaveProperty('publishedAt');
  });

  it('limit padrão é 10 — retorna no máximo 10 artigos', async () => {
    const manyArticles = Array.from({ length: 20 }, (_, i) => ({
      ...MOCK_ARTICLES[0],
      id: String(i),
    }));
    mockFetchGeneralNews.mockResolvedValue({ articles: manyArticles, cached: false });

    const req = new NextRequest('http://localhost:3000/api/market/news');
    const res = await GET(req);
    const body = await res.json();

    expect(body.news.length).toBeLessThanOrEqual(10);
  });

  it('limit personalizado é respeitado', async () => {
    const manyArticles = Array.from({ length: 20 }, (_, i) => ({
      ...MOCK_ARTICLES[0],
      id: String(i),
    }));
    mockFetchGeneralNews.mockResolvedValue({ articles: manyArticles, cached: false });

    const req = new NextRequest('http://localhost:3000/api/market/news?limit=5');
    const res = await GET(req);
    const body = await res.json();

    expect(body.news.length).toBeLessThanOrEqual(5);
  });

  it('retorna 400 se limit > 30', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news?limit=50');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 se limit não é numérico', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news?limit=abc');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('resposta sem q não inclui campo q no body', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news');
    const res = await GET(req);
    const body = await res.json();
    expect(body).not.toHaveProperty('q');
  });
});

describe('TC-02 — GET /api/market/news?q=PETR4: notícias do ticker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchGeneralNews.mockResolvedValue({ articles: MOCK_ARTICLES, cached: false });
    mockFetchTickerNews.mockResolvedValue({ articles: MOCK_ARTICLES, cached: false });
  });

  it('chama fetchTickerNews quando q é fornecido', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news?q=PETR4');
    await GET(req);
    expect(mockFetchTickerNews).toHaveBeenCalledWith('PETR4');
    expect(mockFetchGeneralNews).not.toHaveBeenCalled();
  });

  it('retorna 200 com campo q no body quando q fornecido', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news?q=PETR4');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.q).toBe('PETR4');
  });

  it('chama fetchGeneralNews quando q está ausente', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/news');
    await GET(req);
    expect(mockFetchGeneralNews).toHaveBeenCalled();
    expect(mockFetchTickerNews).not.toHaveBeenCalled();
  });
});

describe('TC-04 — GET /api/market/news com Finnhub em erro: serve fallback com 200', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 200 com fallback quando fetchGeneralNews retorna fallback', async () => {
    mockFetchGeneralNews.mockResolvedValue({ articles: FALLBACK_ARTICLES, cached: false });

    const req = new NextRequest('http://localhost:3000/api/market/news');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.news).toBeDefined();
    expect(body.news.length).toBeGreaterThan(0);
    expect(body.news[0].source).toBe('DataBolsa Editorial');
  });

  it('nunca retorna 5xx — mesmo quando o serviço retorna lista vazia', async () => {
    mockFetchGeneralNews.mockResolvedValue({ articles: [], cached: false });

    const req = new NextRequest('http://localhost:3000/api/market/news');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.news).toEqual([]);
  });
});
