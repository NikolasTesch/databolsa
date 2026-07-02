import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('auth BFF client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('loginBff', () => {
    it('faz POST para /api/session/login com dados corretos', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
      const { loginBff } = await import('@/lib/api/auth');

      await loginBff({ email: 'test@test.com', password: '123456' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/session/login',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'test@test.com', password: '123456' }) }),
      );
    });

    it('lança erro quando resposta não é ok', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ message: 'Credenciais inválidas.' }),
      });
      const { loginBff } = await import('@/lib/api/auth');

      await expect(loginBff({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Credenciais inválidas.');
    });
  });

  describe('logoutBff', () => {
    it('faz POST para /api/session/logout', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
      const { logoutBff } = await import('@/lib/api/auth');

      await logoutBff();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/session/logout',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('refreshBff', () => {
    it('retorna null quando refresh falha', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
      const { refreshBff } = await import('@/lib/api/auth');

      const result = await refreshBff();
      expect(result).toBeNull();
    });

    it('retorna AuthResponse quando refresh funciona', async () => {
      const authData = { access_token: 'abc', refresh_token: 'def' };
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(authData) });
      const { refreshBff } = await import('@/lib/api/auth');

      const result = await refreshBff();
      expect(result).toEqual(authData);
    });
  });
});
