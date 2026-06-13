import { ApiProperty } from '@nestjs/swagger';
import { AssetClass, Currency, DataSource } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  ticker: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: AssetClass })
  @IsEnum(AssetClass)
  asset_class: AssetClass;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ enum: DataSource })
  @IsEnum(DataSource)
  data_source: DataSource;
}
