import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Decimal as PrismaDecimal } from '@prisma/client/runtime/library';
import { calculateCurrentQuantity } from '@databolsa/core';
import { Transaction as CoreTransaction } from '@databolsa/core';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

function toDecimal(value: PrismaDecimal | string | number): Decimal {
  return new Decimal(value.toString());
}

function prismaToCoreTx(tx: {
  type: TransactionType;
  date: Date;
  unit_price: PrismaDecimal;
  quantity: PrismaDecimal;
  fees: PrismaDecimal;
}): CoreTransaction {
  return {
    type: tx.type as 'BUY' | 'SELL',
    date: tx.date.toISOString().slice(0, 10),
    unit_price: toDecimal(tx.unit_price),
    quantity: toDecimal(tx.quantity),
    fees: toDecimal(tx.fees),
  };
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByAsset(assetId: string, userId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, user_id: userId },
    });
    if (!asset) throw new NotFoundException();

    return this.prisma.transaction.findMany({
      where: { asset_id: assetId },
      orderBy: { date: 'asc' },
    });
  }

  async create(assetId: string, dto: CreateTransactionDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findFirst({
        where: { id: assetId, user_id: userId },
      });
      if (!asset) throw new NotFoundException();

      if (dto.type === TransactionType.SELL) {
        const existingTxs = await tx.transaction.findMany({
          where: { asset_id: assetId },
          orderBy: { date: 'asc' },
        });
        const coreTxs = existingTxs.map(prismaToCoreTx);
        const currentQty = calculateCurrentQuantity(coreTxs);
        const sellQty = new Decimal(dto.quantity);

        if (sellQty.greaterThan(currentQty)) {
          throw new UnprocessableEntityException(
            'Sell quantity exceeds current position',
          );
        }
      }

      return tx.transaction.create({
        data: {
          asset_id: assetId,
          type: dto.type,
          date: new Date(dto.date),
          unit_price: dto.unit_price,
          quantity: dto.quantity,
          fees: dto.fees ?? '0',
        },
      });
    });
  }

  async update(id: string, dto: UpdateTransactionDto, userId: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, asset: { user_id: userId } },
      include: { asset: true },
    });
    if (!existing) throw new NotFoundException();

    const data: Record<string, unknown> = {};
    if (dto.date) data.date = new Date(dto.date);
    if (dto.unit_price) data.unit_price = dto.unit_price;
    if (dto.quantity) data.quantity = dto.quantity;
    if (dto.fees !== undefined) data.fees = dto.fees;

    return this.prisma.transaction.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, asset: { user_id: userId } },
    });
    if (!existing) throw new NotFoundException();
    await this.prisma.transaction.delete({ where: { id } });
  }
}
