import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTableDto, UpdateTableDto } from '../dto/table.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  private generateQrToken(): string {
    return randomBytes(16).toString('hex');
  }

  async create(dto: CreateTableDto) {
    const existingTable = await this.prisma.table.findUnique({
      where: {
        outletId_number: {
          outletId: dto.outletId,
          number: dto.number,
        },
      },
    });

    if (existingTable) {
      throw new ConflictException(
        `Table number ${dto.number} already exists in this outlet`,
      );
    }

    return this.prisma.table.create({
      data: {
        outletId: dto.outletId,
        floorId: dto.floorId,
        number: dto.number,
        capacity: dto.capacity ?? 2,
        qrToken: this.generateQrToken(),
      },
    });
  }

  async findAllByOutlet(outletId: string) {
    const tables = await this.prisma.table.findMany({
      where: { outletId },
      include: {
        floor: true,
        tableSessions: {
          where: { status: 'OPEN' },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });

    // Map table occupancy status derived from open session
    return tables.map((table) => ({
      ...table,
      isOccupied: table.tableSessions.length > 0,
      activeSession: table.tableSessions[0] || null,
    }));
  }

  async findByQrToken(qrToken: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: {
        outlet: true,
        floor: true,
        tableSessions: {
          where: { status: 'OPEN' },
          take: 1,
        },
      },
    });

    if (!table || !table.isActive) {
      throw new NotFoundException('Table not found or inactive');
    }

    return {
      ...table,
      activeSession: table.tableSessions[0] || null,
    };
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        floor: true,
        tableSessions: {
          where: { status: 'OPEN' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);
    return this.prisma.table.update({
      where: { id },
      data: dto,
    });
  }

  async regenerateQrToken(id: string) {
    await this.findOne(id);
    return this.prisma.table.update({
      where: { id },
      data: {
        qrToken: this.generateQrToken(),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.table.delete({
      where: { id },
    });
  }
}
