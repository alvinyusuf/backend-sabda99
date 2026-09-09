import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTableDto, UpdateTableDto, ResetTableDto } from '../dto/table.dto';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { randomBytes } from 'crypto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

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

  async findAllByOutlet(outletId: string, includeInactive = false) {
    const tables = await this.prisma.table.findMany({
      where: {
        outletId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        floor: true,
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.WAITING_PAYMENT,
                OrderStatus.CONFIRMED,
                OrderStatus.SERVED,
              ],
            },
          },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });

    return tables.map((table) => ({
      ...table,
      isOccupied: table.orders.length > 0,
      activeOrders: table.orders,
    }));
  }

  async findByQrToken(qrToken: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: {
        outlet: true,
        floor: true,
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.WAITING_PAYMENT,
                OrderStatus.CONFIRMED,
                OrderStatus.SERVED,
              ],
            },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!table || !table.isActive) {
      throw new NotFoundException('Table not found or inactive');
    }

    return {
      ...table,
      isOccupied: table.orders.length > 0,
      activeOrders: table.orders,
    };
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        floor: true,
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.WAITING_PAYMENT,
                OrderStatus.CONFIRMED,
                OrderStatus.SERVED,
              ],
            },
          },
          include: {
            orderItems: true,
            payments: true,
            fulfillment: true,
          },
          orderBy: { createdAt: 'desc' },
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

  async toggleActive(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.table.update({
      where: { id },
      data: { isActive },
    });
  }

  async resetTable(id: string, dto: ResetTableDto, user?: { id?: string; name?: string }) {
    const table = await this.findOne(id);

    const activeOrders = table.orders || [];
    const cancelActiveOrders = dto?.cancelActiveOrders ?? true;
    const reason = dto?.reason || 'Manual table reset by cashier/staff';

    if (cancelActiveOrders && activeOrders.length > 0) {
      const activeOrderIds = activeOrders.map((o) => o.id);

      await this.prisma.$transaction(async (tx) => {
        // Cancel all active orders for this table
        await tx.order.updateMany({
          where: {
            id: { in: activeOrderIds },
          },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });
      });
    }

    await this.auditLogService.logAction(
      'TABLE_RESET',
      'Table',
      table.id,
      user?.id,
      table.outletId,
      {
        tableNumber: table.number,
        reason,
        cancelledOrdersCount: cancelActiveOrders ? activeOrders.length : 0,
      },
    );

    return this.findOne(id);
  }
}
