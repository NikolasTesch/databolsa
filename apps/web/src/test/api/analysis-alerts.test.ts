// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetAuthUser = vi.fn();
vi.mock('@/lib/auth/get-user', () => ({
  getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

const mockCreateAlert = vi.fn();
const mockListAlerts = vi.fn();
const mockUpdateAlert = vi.fn();
const mockDeleteAlert = vi.fn();
vi.mock('@/lib/analysis/analysis-alert.service', () => ({
  createAlert: (...args: unknown[]) => mockCreateAlert(...args),
  listAlerts: (...args: unknown[]) => mockListAlerts(...args),
  updateAlert: (...args: unknown[]) => mockUpdateAlert(...args),
  deleteAlert: (...args: unknown[]) => mockDeleteAlert(...args),
}));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuthUser.mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'USER' });
});

// ---------------------------------------------------------------------------
// GET /api/analysis-alerts
// ---------------------------------------------------------------------------

describe('GET /api/analysis-alerts', () => {
  it('retorna 401 sem autenticação', async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const { GET } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('retorna lista de alertas', async () => {
    mockListAlerts.mockResolvedValue([
      { id: 'a1', ticker: 'PETR4', metric: 'dy', triggered: false, is_active: true },
    ]);

    const { GET } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.alerts).toHaveLength(1);
    expect(json.alerts[0].id).toBe('a1');
  });

  it('passa ticker como filtro', async () => {
    mockListAlerts.mockResolvedValue([]);

    const { GET } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts?ticker=PETR4');
    await GET(req);

    expect(mockListAlerts).toHaveBeenCalledWith('user-1', 'PETR4');
  });
});

// ---------------------------------------------------------------------------
// POST /api/analysis-alerts
// ---------------------------------------------------------------------------

describe('POST /api/analysis-alerts', () => {
  it('retorna 401 sem autenticação', async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const { POST } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts', {
      method: 'POST',
      body: JSON.stringify({ ticker: 'PETR4', metric: 'dy', condition: 'ABOVE', target_value: 6 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('cria alerta com dados válidos', async () => {
    mockCreateAlert.mockResolvedValue({
      id: 'new-alert',
      ticker: 'PETR4',
      metric: 'dy',
      condition: 'ABOVE',
      target_value: '6',
      is_active: true,
      triggered: false,
    });

    const { POST } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'PETR4',
        metric: 'dy',
        condition: 'ABOVE',
        target_value: 6,
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe('new-alert');
    expect(json.ticker).toBe('PETR4');
  });

  it('rejeita métrica inválida', async () => {
    const { POST } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'PETR4',
        metric: 'invalid',
        condition: 'ABOVE',
        target_value: 6,
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejeita target_value <= 0', async () => {
    const { POST } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'PETR4',
        metric: 'dy',
        condition: 'ABOVE',
        target_value: 0,
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejeita condition inválida', async () => {
    const { POST } = await import('@/app/api/analysis-alerts/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'PETR4',
        metric: 'dy',
        condition: 'INVALID',
        target_value: 6,
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/analysis-alerts/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/analysis-alerts/[id]', () => {
  it('atualiza alerta com sucesso', async () => {
    mockUpdateAlert.mockResolvedValue({
      id: 'a1',
      ticker: 'PETR4',
      metric: 'dy',
      is_active: false,
    });

    const { PATCH } = await import('@/app/api/analysis-alerts/[id]/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts/a1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    });
    const res = await PATCH(req, { params: { id: 'a1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.is_active).toBe(false);
  });

  it('retorna 404 quando alerta não encontrado', async () => {
    mockUpdateAlert.mockRejectedValue(new Error('NOT_FOUND'));

    const { PATCH } = await import('@/app/api/analysis-alerts/[id]/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts/nonexistent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true }),
    });
    const res = await PATCH(req, { params: { id: 'nonexistent' } });

    expect(res.status).toBe(404);
  });

  it('rejeita condition inválida no patch', async () => {
    const { PATCH } = await import('@/app/api/analysis-alerts/[id]/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts/a1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condition: 'INVALID' }),
    });
    const res = await PATCH(req, { params: { id: 'a1' } });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/analysis-alerts/[id]
// ---------------------------------------------------------------------------

describe('DELETE /api/analysis-alerts/[id]', () => {
  it('deleta alerta com sucesso', async () => {
    mockDeleteAlert.mockResolvedValue(undefined);

    const { DELETE } = await import('@/app/api/analysis-alerts/[id]/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts/a1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { id: 'a1' } });

    expect(res.status).toBe(204);
  });

  it('retorna 404 quando alerta não encontrado', async () => {
    mockDeleteAlert.mockRejectedValue(new Error('NOT_FOUND'));

    const { DELETE } = await import('@/app/api/analysis-alerts/[id]/route');
    const req = new NextRequest('http://localhost/api/analysis-alerts/nonexistent', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { id: 'nonexistent' } });

    expect(res.status).toBe(404);
  });
});
