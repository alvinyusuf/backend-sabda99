import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { OpenTableSessionDto } from '../dto/table-session.dto';

@Injectable()
export class TableSessionsService {
  constructor(private prisma: PrismaService) {}

  async openSession(dto: OpenTableSessionDto) {
    const table = await this.prisma.table.findUnique({
      where: { id: dto.tableId },
    });

    if (!table || !table.isActive) {
      throw new NotFoundException('Table not found or inactive');
    }

    // Check if there is already an OPEN session on this table
    const activeSession = await this.prisma.tableSession.findFirst({
      where: {
        tableId: dto.tableId,
        status: 'OPEN',
      },
    });

    if (activeSession) {
      throw new ConflictException('Table already has an active open session');
    }

    return this.prisma.tableSession.create({
      data: {
        outletId: table.outletId,
        tableId: table.id,
        guestCount: dto.guestCount ?? 1,
        status: 'OPEN',
        openedAt: new Date(),
      },
      include: {
        table: true,
      },
    });
  }

  async getActiveSessionByTable(tableId: string) {
    const session = await this.prisma.tableSession.findFirst({
      where: {
        tableId,
        status: 'OPEN',
      },
      include: {
        table: true,
        orders: {
          include: {
            orderItems: true,
            payments: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('No active open session for this table');
    }

    return session;
  }

  async closeSession(id: string) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: {
              notIn: ['COMPLETED', 'CANCELLED'],
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Table session with ID ${id} not found`);
    }

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Session is already closed');
    }

    if (session.orders.length > 0) {
      throw new BadRequestException(
        'Cannot close table session with uncompleted or unpaid orders',
      );
    }

    return this.prisma.tableSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
  }
}
