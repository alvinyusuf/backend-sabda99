import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateFloorDto, UpdateFloorDto } from '../dto/floor.dto';

@Injectable()
export class FloorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFloorDto) {
    return this.prisma.floor.create({
      data: {
        outletId: dto.outletId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findAllByOutlet(outletId: string) {
    return this.prisma.floor.findMany({
      where: { outletId },
      include: {
        tables: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id },
      include: { tables: true },
    });

    if (!floor) {
      throw new NotFoundException(`Floor with ID ${id} not found`);
    }

    return floor;
  }

  async update(id: string, dto: UpdateFloorDto) {
    await this.findOne(id);
    return this.prisma.floor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.floor.delete({
      where: { id },
    });
  }
}
