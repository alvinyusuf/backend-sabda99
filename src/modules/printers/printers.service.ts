import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePrinterDto, GenerateKotDto } from './dto/printer.dto';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  modifiers: string[];
}

export interface ReceiptData {
  orderNumber: string;
  date: string;
  cashier: string;
  table: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  payments: { method: string; amount: number }[];
  change: number;
}

@Injectable()
export class PrintersService {
  constructor(private prisma: PrismaService) {}

  async createPrinter(dto: CreatePrinterDto) {
    return this.prisma.printer.create({
      data: dto,
    });
  }

  async findPrintersByOutlet(outletId?: string) {
    const where: any = { isActive: true };
    if (outletId) where.outletId = outletId;
    return this.prisma.printer.findMany({ where });
  }

  async updatePrinter(id: string, dto: Partial<CreatePrinterDto>) {
    const printer = await this.prisma.printer.findUnique({ where: { id } });
    if (!printer) throw new NotFoundException(`Printer with ID ${id} not found`);

    return this.prisma.printer.update({
      where: { id },
      data: dto,
    });
  }

  async deletePrinter(id: string) {
    const printer = await this.prisma.printer.findUnique({ where: { id } });
    if (!printer) throw new NotFoundException(`Printer with ID ${id} not found`);

    return this.prisma.printer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async generateKot(userId: string, dto: GenerateKotDto) {
    // Validate printer if provided
    if (dto.printerId) {
      const printer = await this.prisma.printer.findUnique({
        where: { id: dto.printerId },
      });
      if (!printer || !printer.isActive) {
        throw new NotFoundException('Printer not found or inactive');
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        orderItems: {
          include: {
            orderItemModifiers: true,
          },
        },
        table: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ID ${dto.orderId} not found`);
    }

    if (
      order.status !== 'CONFIRMED' &&
      order.status !== 'SERVED' &&
      order.status !== 'COMPLETED'
    ) {
      throw new BadRequestException(
        'Cannot print KOT for unconfirmed or cancelled orders',
      );
    }

    // Check existing print count
    const existingKotCount = await this.prisma.kitchenOrderTicket.count({
      where: { orderId: dto.orderId },
    });

    // Limit print count to 3 per order
    if (existingKotCount >= 3) {
      throw new BadRequestException(
        'Maximum print count (3) reached for this order',
      );
    }

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
            table: true,
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
TABLE: ${order.table?.number || 'DIRECT/TAKEAWAY'}
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

  async generateReceipt(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { orderItemModifiers: true },
        },
        payments: {
          include: { paymentMethod: true },
        },
        table: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ID ${orderId} not found`);
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot generate receipt for cancelled order');
    }

    const cashier = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const items: ReceiptItem[] = order.orderItems
      .filter((item) => !(item as any).isVoided)
      .map((item) => ({
        name: item.productNameSnapshot,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPriceSnapshot),
        subtotal: Number(item.subtotal),
        modifiers: item.orderItemModifiers.map((m) => m.modifierNameSnapshot),
      }));

    const payments = order.payments
      .filter((p) => p.status === 'PAID')
      .map((p) => ({
        method: p.paymentMethod?.name || 'Unknown',
        amount: Number(p.amount),
      }));

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const change = totalPaid - Number(order.totalAmount);

    const receiptData: ReceiptData = {
      orderNumber: order.orderNumber,
      date: new Date(order.createdAt).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      cashier: cashier?.name || 'Cashier',
      table: order.table?.number || 'TAKEAWAY',
      items,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      payments,
      change: change > 0 ? change : 0,
    };

    const formattedText = this.formatReceipt(receiptData);

    return {
      receiptData,
      formattedText,
    };
  }

  private formatReceipt(data: ReceiptData): string {
    const width = 32;
    const line = '-'.repeat(width);
    const doubleLine = '='.repeat(width);

    let receipt = '';
    receipt += doubleLine + '\n';
    receipt += '        SABDA 99 COFFEE\n';
    receipt += '   Jl. Contoh No. 123, Kota\n';
    receipt += '     Telp: 0812-xxxx-xxxx\n';
    receipt += doubleLine + '\n';
    receipt += `No. Order : ${data.orderNumber}\n`;
    receipt += `Tanggal   : ${data.date}\n`;
    receipt += `Kasir     : ${data.cashier}\n`;
    receipt += `Meja      : ${data.table}\n`;
    receipt += line + '\n';

    for (const item of data.items) {
      receipt += `${item.quantity}x ${item.name}\n`;
      receipt += `  ${this.formatCurrency(item.subtotal)}\n`;
      for (const mod of item.modifiers) {
        receipt += `   - ${mod}\n`;
      }
    }

    receipt += line + '\n';
    receipt += `Subtotal    : ${this.formatCurrency(data.subtotal).padStart(12)}\n`;
    receipt += `Pajak (10%) : ${this.formatCurrency(data.taxAmount).padStart(12)}\n`;
    receipt += `TOTAL       : ${this.formatCurrency(data.totalAmount).padStart(12)}\n`;
    receipt += line + '\n';

    for (const payment of data.payments) {
      receipt += `Bayar (${payment.method}): ${this.formatCurrency(payment.amount).padStart(12)}\n`;
    }
    if (data.change > 0) {
      receipt += `Kembalian   : ${this.formatCurrency(data.change).padStart(12)}\n`;
    }

    receipt += doubleLine + '\n';
    receipt += '    Terima kasih atas kunjungan\n';
    receipt += '         Sampai jumpa lagi!\n';
    receipt += doubleLine + '\n';

    return receipt;
  }

  private formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
}
