import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { TransactionsService } from './transactions.service';

// Helper to create a Prisma-like Decimal object (toString returns the value)
function prismaDecimal(value: string) {
  return { toString: () => value } as any;
}

function makePrismaTx(type: 'BUY' | 'SELL', quantity: string, unitPrice = '10.00') {
  return {
    id: 'tx-id',
    asset_id: 'asset-id',
    type: type as TransactionType,
    date: new Date('2024-01-01'),
    unit_price: prismaDecimal(unitPrice),
    quantity: prismaDecimal(quantity),
    fees: prismaDecimal('0'),
    created_at: new Date(),
  };
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: {
    asset: { findFirst: jest.Mock };
    transaction: { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; delete: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      asset: { findFirst: jest.fn() },
      transaction: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new TransactionsService(prisma as any);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create — SELL validation', () => {
    it('should throw UnprocessableEntityException (422) when SELL quantity exceeds position', async () => {
      // Simulate prisma.$transaction calling the callback inline
      prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txClient = {
          asset: {
            findFirst: jest.fn().mockResolvedValue({ id: 'asset-id', user_id: 'user-id' }),
          },
          transaction: {
            findMany: jest.fn().mockResolvedValue([
              makePrismaTx('BUY', '10'), // position = 10 units
            ]),
            create: jest.fn(),
          },
        };
        return cb(txClient);
      });

      await expect(
        service.create(
          'asset-id',
          { type: TransactionType.SELL, date: '2024-06-01', unit_price: '10', quantity: '15' },
          'user-id',
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should insert SELL when quantity is within position', async () => {
      const createdTx = { id: 'new-tx-id', type: 'SELL', quantity: prismaDecimal('5') };

      prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txClient = {
          asset: {
            findFirst: jest.fn().mockResolvedValue({ id: 'asset-id', user_id: 'user-id' }),
          },
          transaction: {
            findMany: jest.fn().mockResolvedValue([
              makePrismaTx('BUY', '10'), // position = 10 units
            ]),
            create: jest.fn().mockResolvedValue(createdTx),
          },
        };
        return cb(txClient);
      });

      const result = await service.create(
        'asset-id',
        { type: TransactionType.SELL, date: '2024-06-01', unit_price: '10', quantity: '5' },
        'user-id',
      );

      expect(result).toBe(createdTx);
    });

    it('should insert BUY without quantity validation', async () => {
      const createdTx = { id: 'new-tx-id', type: 'BUY', quantity: prismaDecimal('100') };

      prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txClient = {
          asset: {
            findFirst: jest.fn().mockResolvedValue({ id: 'asset-id', user_id: 'user-id' }),
          },
          transaction: {
            findMany: jest.fn(),
            create: jest.fn().mockResolvedValue(createdTx),
          },
        };
        return cb(txClient);
      });

      const result = await service.create(
        'asset-id',
        { type: TransactionType.BUY, date: '2024-06-01', unit_price: '50', quantity: '100' },
        'user-id',
      );

      expect(result).toBe(createdTx);
    });

    it('should throw NotFoundException when asset does not belong to user', async () => {
      prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txClient = {
          asset: {
            findFirst: jest.fn().mockResolvedValue(null), // asset not found for this user
          },
          transaction: { findMany: jest.fn(), create: jest.fn() },
        };
        return cb(txClient);
      });

      await expect(
        service.create(
          'asset-id',
          { type: TransactionType.BUY, date: '2024-06-01', unit_price: '10', quantity: '5' },
          'other-user-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
