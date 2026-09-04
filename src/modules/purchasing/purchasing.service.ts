import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
} from './dto/purchasing.dto';
import { StockMovementType } from '@prisma/client';
import { convertToBaseUom } from '../inventory/inventory-uom.util';

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

    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: dto.items.map((i) => i.inventoryItemId) } },
    });
    const inventoryItemById = new Map(inventoryItems.map((item) => [item.id, item]));

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
              uomId: i.uomId ?? null,
            })),
          },
        },
      });

      // Update Stock balance and create Purchase Stock Movement for each received item
      for (const item of dto.items) {
        const inventoryItem = inventoryItemById.get(item.inventoryItemId);
        if (!inventoryItem) {
          throw new NotFoundException(
            `Inventory Item ID ${item.inventoryItemId} not found`,
          );
        }

        const baseQuantity = convertToBaseUom(
          {
            uomId: inventoryItem.uomId,
            purchaseUomId: inventoryItem.purchaseUomId,
            purchaseConversionFactor: inventoryItem.purchaseConversionFactor
              ? Number(inventoryItem.purchaseConversionFactor)
              : null,
            recipeUomId: inventoryItem.recipeUomId,
            recipeConversionFactor: inventoryItem.recipeConversionFactor
              ? Number(inventoryItem.recipeConversionFactor)
              : null,
          },
          item.uomId ?? inventoryItem.uomId,
          item.receivedQuantity,
        );

        // Increase Stock (in Base UoM)
        await tx.stock.upsert({
          where: {
            warehouseId_inventoryItemId: {
              warehouseId: dto.warehouseId,
              inventoryItemId: item.inventoryItemId,
            },
          },
          update: { quantity: { increment: baseQuantity } },
          create: {
            warehouseId: dto.warehouseId,
            inventoryItemId: item.inventoryItemId,
            quantity: baseQuantity,
          },
        });

        // Record Purchase Stock Movement (+), in Base UoM
        await tx.stockMovement.create({
          data: {
            warehouseId: dto.warehouseId,
            inventoryItemId: item.inventoryItemId,
            type: StockMovementType.PURCHASE,
            quantity: baseQuantity,
            referenceType: 'GOODS_RECEIPT',
            referenceId: gr.id,
          },
        });

        // Update PO Item received quantity (Base UoM, matching PurchaseOrderItem.quantity)
        const poItem = po.purchaseItems.find(
          (pi) => pi.inventoryItemId === item.inventoryItemId,
        );

        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQuantity: { increment: baseQuantity },
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
