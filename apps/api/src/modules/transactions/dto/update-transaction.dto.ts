import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class UpdateTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  unit_price?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  fees?: string;
}
