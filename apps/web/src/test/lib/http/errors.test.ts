import { describe, it, expect } from 'vitest';
import { jsonError } from '@/lib/http/errors';

describe('jsonError', () => {
  it('retorna Response com status e body', async () => {
    const response = jsonError('NOT_FOUND', 'Recurso não encontrado.', 404);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ message: 'Recurso não encontrado.', error: { code: 'NOT_FOUND' } });
  });

  it('retorna 400 para VALIDATION_ERROR', async () => {
    const response = jsonError('VALIDATION_ERROR', 'Dados inválidos.', 400);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 500 para INTERNAL_ERROR', async () => {
    const response = jsonError('INTERNAL_ERROR', 'Erro interno do servidor.', 500);
    expect(response.status).toBe(500);
  });
});
