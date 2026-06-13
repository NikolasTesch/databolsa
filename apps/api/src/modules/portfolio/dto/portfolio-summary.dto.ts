import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PositionSummaryDto {
  @ApiProperty() ticker: string;
  @ApiProperty() asset_id: string;
  @ApiProperty() current_quantity: string;
  @ApiProperty() average_price: string;
  @ApiProperty() invested_value: string;
  @ApiPropertyOptional() valor_atual_brl: string | null;
  @ApiPropertyOptional() lucro_prejuizo_brl: string | null;
  @ApiPropertyOptional() lucro_prejuizo_pct: string | null;
  @ApiPropertyOptional() alocacao_pct: string | null;
  @ApiProperty() is_stale: boolean;
}

export class PortfolioSummaryDto {
  @ApiProperty({ type: [PositionSummaryDto] }) positions: PositionSummaryDto[];
  @ApiProperty() patrimonio_total_brl: string;
}
