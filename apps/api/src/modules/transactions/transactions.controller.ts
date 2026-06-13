import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('assets/:assetId/transactions')
  findAll(
    @Param('assetId') assetId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.transactionsService.findAllByAsset(assetId, user.sub);
  }

  @Post('assets/:assetId/transactions')
  create(
    @Param('assetId') assetId: string,
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.transactionsService.create(assetId, dto, user.sub);
  }

  @Patch('transactions/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.transactionsService.update(id, dto, user.sub);
  }

  @Delete('transactions/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.transactionsService.remove(id, user.sub);
  }
}
