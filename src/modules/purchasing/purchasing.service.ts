import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
} from './dto/purchasing.dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class PurchasingService {
  constructor(private prisma: PrismaService) {}

  private generatePoNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PO-${dateStr}-${randomSuffix}`;
  }

  private generateGrNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `GR-${dateStr}-${randomSuffix}`;
  }

  // Supplier Management
  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async findAllSuppliers() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  // Purchase Orders (Does NOT increase stock)
  async createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    return this.prisma.purchaseOrder.create({
      data: {
        outletId: dto.outletId,
        supplierId: dto.supplierId,
        orderNumber: this.generatePoNumber(),
        status: 'ORDERED',
        orderedAt: new Date(),
        purchaseItems: {
          create: dto.items.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            quantity: i.quantity,
            receivedQuantity: 0,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
        purchaseItems: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  }

  async findAllPurchaseOrders(outletId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { outletId },
      include: {
        supplier: true,
        purchaseItems: {
          include: {
            inventoryItem: true,
          },
        },
        goodsReceipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Goods Receipts (Atomically Increases Stock)
  async createGoodsReceipt(userId: string, dto: CreateGoodsReceiptDto) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: dto.purchaseOrderId },
      include: { purchaseItems: true },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order ID ${dto.purchaseOrderId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const receiptNumber = this.generateGrNumber();

      const gr = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId: dto.purchaseOrderId,
          warehouseId: dto.warehouseId,
          receiptNumber,
          status: 'COMPLETED',
          receivedById: userId,
          receivedAt: new Date(),
          receiptItems: {
            create: dto.items.map((i) => ({
              inventoryItemId: i.inventoryItemId,
              orderedQuantity: i.orderedQuantity,
              receivedQuantity: i.receivedQuantity,
              unitCost: i.unitCost,
            })),
          },
        },
      });

      // Update Stock balance and create Purchase Stock Movement for each received item
      for (const item of dto.items) {
        // Increase Stock
        await tx.stock.upsert({
          where: {
            warehouseId_inventoryItemId: {
              warehouseId: dto.warehouseId,
              inventoryItemId: item.inventoryItemId,
            },
          },
          update: { quantity: { increment: item.receivedQuantity } },
          create: {
            warehouseId: dto.warehouseId,
            inventoryItemId: item.inventoryItemId,
            quantity: item.receivedQuantity,
          },
        });

        // Record Purchase Stock Movement (+)
        await tx.stockMovement.create({
          data: {
            warehouseId: dto.warehouseId,
            inventoryItemId: item.inventoryItemId,
            type: StockMovementType.PURCHASE,
            quantity: item.receivedQuantity,
            referenceType: 'GOODS_RECEIPT',
            referenceId: gr.id,
          },
        });

        // Update PO Item received quantity
        const poItem = po.purchaseItems.find(
          (pi) => pi.inventoryItemId === item.inventoryItemId,
        );

        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQuantity: { increment: item.receivedQuantity },
            },
          });
        }
      }

      // Check if PO is completely received
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: dto.purchaseOrderId },
      });

      const allReceived = updatedPoItems.every(
        (pi) => Number(pi.receivedQuantity) >= Number(pi.quantity),
      );

      await tx.purchaseOrder.update({
        where: { id: dto.purchaseOrderId },
        data: {
          status: allReceived ? 'RECEIVED' : 'PARTIAL',
        },
      });

      return gr;
    });
  }
}
