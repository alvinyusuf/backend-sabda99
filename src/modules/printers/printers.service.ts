import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePrinterDto, GenerateKotDto } from './dto/printer.dto';

@Injectable()
export class PrintersService {
  constructor(private prisma: PrismaService) {}

  async createPrinter(dto: CreatePrinterDto) {
    return this.prisma.printer.create({
      data: dto,
    });
  }

  async findPrintersByOutlet(outletId: string) {
    return this.prisma.printer.findMany({
      where: { outletId, isActive: true },
    });
  }

  async generateKot(userId: string, dto: GenerateKotDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        orderItems: {
          include: {
            orderItemModifiers: true,
          },
        },
        tableSession: {
          include: {
            table: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ID ${dto.orderId} not found`);
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'SERVED' && order.status !== 'COMPLETED') {
      throw new BadRequestException('Cannot print KOT for unconfirmed or cancelled orders');
    }

    // Check existing print count
    const existingKotCount = await this.prisma.kitchenOrderTicket.count({
      where: { orderId: dto.orderId },
    });

    const kot = await this.prisma.kitchenOrderTicket.create({
      data: {
        orderId: dto.orderId,
        printerId: dto.printerId,
        printedById: userId,
        printCount: existingKotCount + 1,
        printedAt: new Date(),
      },
      include: {
        printer: true,
        printedBy: { select: { id: true, name: true, email: true } },
        order: {
          include: {
            orderItems: {
              include: {
                orderItemModifiers: true,
              },
            },
            tableSession: {
              include: {
                table: true,
              },
            },
          },
        },
      },
    });

    // Format KOT text output (Ready for thermal printer transmission)
    const ticketHeader = `
================================
          SABDA 99
       KITCHEN TICKET
================================
ORDER: #${order.orderNumber}
TABLE: ${order.tableSession?.table?.number || 'DIRECT/TAKEAWAY'}
DATE : ${new Date().toLocaleTimeString('id-ID')}
PRINT: #${kot.printCount}
--------------------------------
`;

    let ticketBody = '';
    for (const item of order.orderItems) {
      ticketBody += `${item.quantity}x ${item.productNameSnapshot}\n`;
      for (const mod of item.orderItemModifiers) {
        ticketBody += `   - ${mod.modifierNameSnapshot}\n`;
      }
      if (item.notes) {
        ticketBody += `   * Notes: ${item.notes}\n`;
      }
    }

    const ticketFooter = `
--------------------------------
Printed by: ${kot.printedBy?.name || 'Cashier'}
================================
`;

    return {
      kot,
      formattedText: ticketHeader + ticketBody + ticketFooter,
    };
  }
}
