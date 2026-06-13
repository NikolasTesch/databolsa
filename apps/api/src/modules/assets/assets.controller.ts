import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.assetsService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.assetsService.findOne(id, user.sub);
  }

  @Post()
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: { sub: string }) {
    return this.assetsService.create(dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.assetsService.remove(id, user.sub);
  }
}
