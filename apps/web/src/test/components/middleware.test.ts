/**
 * TC-02 — middleware: acesso a rota protegida sem cookie redireciona para /login.
 * Cobre REQ-01, AC-01.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('middleware', () => {
  function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
    const url = `http://localhost:3000${pathname}`;
    const req = new NextRequest(url);
    // Simula cookies
    Object.entries(cookies).forEach(([name, value]) => {
      req.cookies.set(name, value);
    });
    return req;
  }

  it('redireciona /dashboard para /login quando não autenticado', () => {
    const req = makeRequest('/dashboard');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('redireciona /assets para /login quando não autenticado', () => {
    const req = makeRequest('/assets');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('inclui ?next= na URL de redirecionamento', () => {
    const req = makeRequest('/dashboard');
    const res = middleware(req);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('next=%2Fdashboard');
  });

  it('permite acesso a /dashboard com cookie válido', () => {
    const req = makeRequest('/dashboard', { access_token: 'fake-token' });
    const res = middleware(req);
    // next() retorna status 200 (NextResponse.next())
    expect(res.status).toBe(200);
  });

  it('redireciona /login para /dashboard quando já autenticado', () => {
    const req = makeRequest('/login', { access_token: 'fake-token' });
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
  });

  it('permite acesso a /login sem autenticação', () => {
    const req = makeRequest('/login');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});
