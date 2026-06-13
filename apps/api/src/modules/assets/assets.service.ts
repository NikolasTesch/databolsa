import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.asset.findMany({ where: { user_id: userId } });
  }

  async findOne(id: string, userId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, user_id: userId },
    });
    if (!asset) throw new NotFoundException();
    return asset;
  }

  create(dto: CreateAssetDto, userId: string) {
    return this.prisma.asset.create({
      data: { ...dto, user_id: userId },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.asset.delete({ where: { id } });
  }
}
