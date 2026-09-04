import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderChannel, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${dateStr}-${randomSuffix}`;
  }

  async createOrder(dto: CreateOrderDto) {
    const channel = dto.channel || OrderChannel.TABLE;

    // Validate Table Session if channel is TABLE
    if (channel === OrderChannel.TABLE) {
      if (!dto.tableSessionId) {
        throw new BadRequestException('tableSessionId is required for TABLE orders');
      }

      const session = await this.prisma.tableSession.findUnique({
        where: { id: dto.tableSessionId },
      });

      if (!session || session.status !== 'OPEN') {
        throw new BadRequestException('Invalid or closed table session');
      }
    }

    // Process order items & fetch prices for SNAPSHOTS
    let subtotal = 0;
    const preparedItems: any[] = [];

    for (const itemDto of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: itemDto.productId },
      });

      if (!product || !product.isActive) {
        throw new NotFoundException(`Product ID ${itemDto.productId} not found or inactive`);
      }

      const unitPrice = Number(product.price);
      let itemSubtotal = unitPrice * itemDto.quantity;

      const preparedModifiers: any[] = [];

      if (itemDto.modifiers && itemDto.modifiers.length > 0) {
        for (const modDto of itemDto.modifiers) {
          const modifier = await this.prisma.modifier.findUnique({
            where: { id: modDto.modifierId },
          });

          if (!modifier || !modifier.isActive) {
            throw new NotFoundException(`Modifier ID ${modDto.modifierId} not found or inactive`);
          }

          const priceAdj = Number(modifier.priceAdjustment);
          itemSubtotal += priceAdj * itemDto.quantity;

          preparedModifiers.push({
            modifierId: modifier.id,
            modifierNameSnapshot: modifier.name,
            priceAdjustmentSnapshot: priceAdj,
          });
        }
      }

      subtotal += itemSubtotal;

      preparedItems.push({
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: unitPrice,
        quantity: itemDto.quantity,
        subtotal: itemSubtotal,
        notes: itemDto.notes,
        orderItemModifiers: {
          create: preparedModifiers,
        },
      });
    }

    // Fetch active outlet tax if configured
    const activeTax = await this.prisma.tax.findFirst({
      where: { outletId: dto.outletId, isActive: true },
    });

    const taxRate = activeTax ? Number(activeTax.rate) / 100 : 0;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Execute atomic creation
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          outletId: dto.outletId,
          tableSessionId: dto.tableSessionId,
          orderNumber: this.generateOrderNumber(),
          channel,
          status: OrderStatus.WAITING_PAYMENT,
          subtotal,
          discountAmount: 0,
          taxAmount,
          totalAmount,
          notes: dto.notes,
          orderItems: {
            create: preparedItems,
          },
          fulfillment: {
            create: {
              status: 'NOT_STARTED',
            },
          },
        },
        include: {
          orderItems: {
            include: {
              orderItemModifiers: true,
            },
          },
          fulfillment: true,
          tableSession: {
            include: {
              table: true,
            },
          },
        },
      });

      return order;
    });
  }

  async findAll(outletId: string, status?: OrderStatus, channel?: OrderChannel) {
    return this.prisma.order.findMany({
      where: {
        outletId,
        ...(status ? { status } : {}),
        ...(channel ? { channel } : {}),
      },
      include: {
        orderItems: {
          include: {
            orderItemModifiers: true,
          },
        },
        payments: true,
        fulfillment: true,
        tableSession: {
          include: {
            table: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            orderItemModifiers: true,
          },
        },
        payments: {
          include: {
            paymentMethod: true,
            confirmedBy: { select: { id: true, name: true, email: true } },
          },
        },
        fulfillment: true,
        kitchenOrderTickets: true,
        tableSession: {
          include: {
            table: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            orderItemModifiers: true,
          },
        },
        payments: true,
        fulfillment: true,
        tableSession: {
          include: {
            table: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order number ${orderNumber} not found`);
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const updateData: any = { status: dto.status };
    if (dto.status === OrderStatus.CONFIRMED && !order.confirmedAt) {
      updateData.confirmedAt = new Date();
    } else if (dto.status === OrderStatus.COMPLETED && !order.completedAt) {
      updateData.completedAt = new Date();
    } else if (dto.status === OrderStatus.CANCELLED && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
    }

    // Auto-deduct stock from recipes when order is confirmed
    if (dto.status === OrderStatus.CONFIRMED && !order.confirmedAt) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { outletId: order.outletId, isActive: true },
      });

      if (warehouse) {
        await this.inventoryService.consumeStockForOrder(id, warehouse.id);
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        fulfillment: true,
      },
    });
  }
}
