import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryCache, type MemoryCache } from '@/lib/cache/memory-cache';

describe('createMemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = createMemoryCache<string>(60_000); // 1 min TTL
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('get retorna null para chave inexistente', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('set e get retornam valor', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('get retorna null após expiração', () => {
    cache.set('key1', 'value1');
    vi.advanceTimersByTime(61_000);
    expect(cache.get('key1')).toBeNull();
  });

  it('has retorna true para chave existente', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
  });

  it('has retorna false para chave expirada', () => {
    cache.set('key1', 'value1');
    vi.advanceTimersByTime(61_000);
    expect(cache.has('key1')).toBe(false);
  });

  it('delete remove chave', () => {
    cache.set('key1', 'value1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  it('clear remove todas as chaves', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('múltiplos caches são independentes', () => {
    const cacheA = createMemoryCache<string>(1000);
    const cacheB = createMemoryCache<string>(1000);
    cacheA.set('shared', 'fromA');
    expect(cacheB.get('shared')).toBeNull();
  });
});
