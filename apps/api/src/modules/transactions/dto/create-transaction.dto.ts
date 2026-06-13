import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumberString, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '50.25' })
  @IsNumberString()
  unit_price: string;

  @ApiProperty({ example: '10' })
  @IsNumberString()
  quantity: string;

  @ApiPropertyOptional({ example: '0.50' })
  @IsOptional()
  @IsNumberString()
  fees?: string;
}
