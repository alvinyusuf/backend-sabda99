import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';

@Injectable()
export class TaxService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaxDto) {
    return this.prisma.$transaction(async (tx) => {
      const tax = await tx.tax.create({
        data: {
          outletId: dto.outletId,
          name: dto.name,
          rate: dto.rate,
          isActive: true,
        },
      });

      await tx.tax.updateMany({
        where: { outletId: dto.outletId, id: { not: tax.id }, isActive: true },
        data: { isActive: false },
      });

      return tax;
    });
  }

  async findAllByOutlet(outletId: string) {
    return this.prisma.tax.findMany({
      where: { outletId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateTaxDto) {
    const existing = await this.prisma.tax.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Tax ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.tax.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      if (dto.isActive === true) {
        await tx.tax.updateMany({
          where: {
            outletId: existing.outletId,
            id: { not: id },
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      return updated;
    });
  }
}
