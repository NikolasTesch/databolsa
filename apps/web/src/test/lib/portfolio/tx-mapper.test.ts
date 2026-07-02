import { describe, it, expect } from 'vitest';
import { prismaToCoreTx, type PrismaTxFields } from '@/lib/portfolio/tx-mapper';
import { Decimal } from 'decimal.js';

describe('prismaToCoreTx', () => {
  const makeTx = (overrides: Partial<PrismaTxFields> = {}): PrismaTxFields => ({
    type: 'BUY' as const,
    date: new Date('2024-06-15'),
    unit_price: new Decimal('25.50') as unknown as PrismaTxFields['unit_price'],
    quantity: new Decimal('100') as unknown as PrismaTxFields['quantity'],
    fees: new Decimal('5.00') as unknown as PrismaTxFields['fees'],
    ...overrides,
  });

  it('converte BUY transaction corretamente', () => {
    const result = prismaToCoreTx(makeTx());
    expect(result.type).toBe('BUY');
    expect(result.date).toBe('2024-06-15');
    expect(result.unit_price.toString()).toBe('25.5');
    expect(result.quantity.toString()).toBe('100');
    expect(result.fees.toString()).toBe('5');
  });

  it('converte SELL transaction corretamente', () => {
    const result = prismaToCoreTx(makeTx({ type: 'SELL' }));
    expect(result.type).toBe('SELL');
    expect(result.date).toBe('2024-06-15');
  });

  it('converte DIVIDEND transaction corretamente', () => {
    const result = prismaToCoreTx(makeTx({ type: 'DIVIDEND' }));
    expect(result.type).toBe('DIVIDEND');
  });

  it('preserva a data como YYYY-MM-DD', () => {
    const date = new Date('2024-12-01T15:30:00Z');
    const result = prismaToCoreTx(makeTx({ date }));
    expect(result.date).toBe('2024-12-01');
  });

  it('converte fees zero corretamente', () => {
    const result = prismaToCoreTx(makeTx({ fees: new Decimal('0') as unknown as PrismaTxFields['fees'] }));
    expect(result.fees.toString()).toBe('0');
  });
});
