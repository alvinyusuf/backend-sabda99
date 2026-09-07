import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateUomDto,
  CreateInventoryItemDto,
  CreateWarehouseDto,
  CreateStockTransferDto,
  CreateStockOpnameDto,
  RecordWasteDto,
} from './dto/inventory.dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // --------------------------------------------------
  // UOM Management
  // --------------------------------------------------
  async createUom(dto: CreateUomDto) {
    const existing = await this.prisma.uom.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`UOM code ${dto.code} already exists`);
    }

    return this.prisma.uom.create({ data: dto });
  }

  async findAllUoms() {
    return this.prisma.uom.findMany({ orderBy: { code: 'asc' } });
  }

  async updateUom(id: string, payload: { code?: string; name?: string; type?: string }) {
    const uom = await this.prisma.uom.findUnique({ where: { id } });
    if (!uom) throw new NotFoundException(`UOM ${id} not found`);
    return this.prisma.uom.update({ where: { id }, data: payload });
  }

  async deleteUom(id: string) {
    const uom = await this.prisma.uom.findUnique({ where: { id } });
    if (!uom) throw new NotFoundException(`UOM ${id} not found`);
    return this.prisma.uom.delete({ where: { id } });
  }

  // --------------------------------------------------
  // Inventory Items
  // --------------------------------------------------
  async createInventoryItem(dto: CreateInventoryItemDto) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { sku: dto.sku },
    });

    if (existing) {
      throw new ConflictException(
        `Inventory Item SKU ${dto.sku} already exists`,
      );
    }

    return this.prisma.inventoryItem.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        itemType: dto.itemType,
        uomId: dto.uomId,
        cost: dto.cost ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
      },
      include: { uom: true },
    });
  }

  async findAllInventoryItems() {
    return this.prisma.inventoryItem.findMany({
      include: { uom: true, stocks: { include: { warehouse: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateInventoryItem(id: string, payload: Partial<CreateInventoryItemDto>) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: payload,
      include: { uom: true },
    });
  }

  async deleteInventoryItem(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --------------------------------------------------
  // Warehouse & Stock Balance
  // --------------------------------------------------
  async createWarehouse(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });
  }

  async findWarehousesByOutlet(outletId: string) {
    return this.prisma.warehouse.findMany({
      where: { outletId, isActive: true },
    });
  }

  async updateWarehouse(id: string, payload: { name?: string; code?: string }) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException(`Warehouse ${id} not found`);
    return this.prisma.warehouse.update({ where: { id }, data: payload });
  }

  async deleteWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException(`Warehouse ${id} not found`);
    return this.prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  }

  async getWarehouseStock(warehouseId: string) {
    return this.prisma.stock.findMany({
      where: { warehouseId },
      include: { inventoryItem: { include: { uom: true } } },
    });
  }

  // --------------------------------------------------
  // Stock Movements Audit Trail
  // --------------------------------------------------
  async getStockMovements(warehouseId?: string, inventoryItemId?: string) {
    return this.prisma.stockMovement.findMany({
      where: {
        ...(warehouseId ? { warehouseId } : {}),
        ...(inventoryItemId ? { inventoryItemId } : {}),
      },
      include: {
        warehouse: true,
        inventoryItem: { include: { uom: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }

  // --------------------------------------------------
  // Stock Transfer
  // --------------------------------------------------
  async transferStock(dto: CreateStockTransferDto) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse cannot be the same',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.create({
        data: {
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          status: 'COMPLETED',
          transferredAt: new Date(),
          transferItems: {
            create: dto.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
            })),
          },
        },
      });

      for (const item of dto.items) {
        // Decrease source stock
        const sourceStock = await tx.stock.findUnique({
          where: {
            warehouseId_inventoryItemId: {
              warehouseId: dto.fromWarehouseId,
              inventoryItemId: item.inventoryItemId,
            },
          },
        });

        if (!sourceStock || Number(sourceStock.quantity) < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for item ID ${item.inventoryItemId} in source warehouse`,
          );
        }

        await tx.stock.update({
          where: { id: sourceStock.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Increase destination stock
        await tx.stock.upsert({
          where: {
            warehouseId_inventoryItemId: {
              warehouseId: dto.toWarehouseId,
              inventoryItemId: item.inventoryItemId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            warehouseId: dto.toWarehouseId,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
          },
        });

        // Create Stock Movement Records
        await tx.stockMovement.create({
          data: {
            warehouseId: dto.fromWarehouseId,
            inventoryItemId: item.inventoryItemId,
            type: StockMovementType.TRANSFER_OUT,
            quantity: -item.quantity,
            referenceType: 'STOCK_TRANSFER',
            referenceId: transfer.id,
          },
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: dto.toWarehouseId,
            inventoryItemId: item.inventoryItemId,
            type: StockMovementType.TRANSFER_IN,
            quantity: item.quantity,
            referenceType: 'STOCK_TRANSFER',
            referenceId: transfer.id,
          },
        });
      }

      return transfer;
    });
  }

  // --------------------------------------------------
  // Stock Opname
  // --------------------------------------------------
  async performStockOpname(userId: string, dto: CreateStockOpnameDto) {
    return this.prisma.$transaction(async (tx) => {
      const opnameItemsData: any[] = [];

      for (const item of dto.items) {
        const currentStock = await tx.stock.findUnique({
          where: {
            warehouseId_inventoryItemId: {
              warehouseId: dto.warehouseId,
              inventoryItemId: item.inventoryItemId,
            },
          },
        });

        const systemQty = currentStock ? Number(currentStock.quantity) : 0;
        const variance = item.actualQuantity - systemQty;

        opnameItemsData.push({
          inventoryItemId: item.inventoryItemId,
          systemQuantity: systemQty,
          actualQuantity: item.actualQuantity,
          variance,
        });
      }

      const opname = await tx.stockOpname.create({
        data: {
          warehouseId: dto.warehouseId,
          performedById: userId,
          status: 'COMPLETED',
          performedAt: new Date(),
          opnameItems: {
            create: opnameItemsData,
          },
        },
      });

      // Apply variance adjustments to stock balance & movements
      for (const opItem of opnameItemsData) {
        if (opItem.variance !== 0) {
          await tx.stock.upsert({
            where: {
              warehouseId_inventoryItemId: {
                warehouseId: dto.warehouseId,
                inventoryItemId: opItem.inventoryItemId,
              },
            },
            update: { quantity: opItem.actualQuantity },
            create: {
              warehouseId: dto.warehouseId,
              inventoryItemId: opItem.inventoryItemId,
              quantity: opItem.actualQuantity,
            },
          });

          await tx.stockMovement.create({
            data: {
              warehouseId: dto.warehouseId,
              inventoryItemId: opItem.inventoryItemId,
              type: StockMovementType.OPNAME,
              quantity: opItem.variance,
              referenceType: 'STOCK_OPNAME',
              referenceId: opname.id,
            },
          });
        }
      }

      return opname;
    });
  }

  // --------------------------------------------------
  // Inventory Dashboard
  // --------------------------------------------------
  async getDashboard(outletId: string) {
    const warehouseIds = (
      await this.prisma.warehouse.findMany({
        where: { outletId, isActive: true },
        select: { id: true },
      })
    ).map((w) => w.id);

    const totalItems = await this.prisma.inventoryItem.count({
      where: { isActive: true },
    });

    const stocks = await this.prisma.stock.findMany({
      where: { warehouseId: { in: warehouseIds } },
      include: { inventoryItem: true },
    });

    const totalStockValue = stocks.reduce(
      (sum, s) => sum + Number(s.quantity) * Number(s.inventoryItem.cost),
      0,
    );

    const lowStockCount = stocks.filter(
      (s) => Number(s.quantity) <= Number(s.inventoryItem.reorderLevel),
    ).length;

    const recentMovements = await this.prisma.stockMovement.findMany({
      where: { warehouseId: { in: warehouseIds } },
      include: {
        inventoryItem: { select: { name: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    return {
      totalItems,
      totalStockValue,
      lowStockCount,
      recentMovements,
    };
  }

  // --------------------------------------------------
  // Stock Consumption for Orders
  // --------------------------------------------------
  async consumeStockForOrder(
    orderId: string,
    warehouseId: string,
    tx?: any, // Optional transaction client
  ) {
    const prisma = tx || this.prisma;

    // Fetch the order with full item details + recipes
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            orderItemModifiers: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ID ${orderId} not found`);
    }

    // Build a flat list of { inventoryItemId, quantity } deductions
    const deductions: { inventoryItemId: string; quantity: number }[] = [];

    for (const item of order.orderItems) {
      // Find the active recipe for this product
      const recipe = await prisma.recipe.findFirst({
        where: { productId: item.productId, isActive: true },
        include: {
          recipeItems: true,
        },
      });

      if (!recipe) {
        // No recipe configured for this product — skip silently
        continue;
      }

      // Each recipe item defines how much of an ingredient is needed per 1 unit of product
      for (const recipeItem of recipe.recipeItems) {
        const deductQty = Number(recipeItem.quantity) * Number(item.quantity);
        deductions.push({
          inventoryItemId: recipeItem.inventoryItemId,
          quantity: deductQty,
        });
      }

      // Handle modifier recipe items (extra ingredients for modifiers)
      for (const mod of item.orderItemModifiers) {
        const modifierRecipe = await prisma.modifierRecipeItem.findFirst({
          where: { modifierId: mod.modifierId },
        });

        if (modifierRecipe) {
          const deductQty =
            Number(modifierRecipe.quantity) * Number(item.quantity);
          deductions.push({
            inventoryItemId: modifierRecipe.inventoryItemId,
            quantity: deductQty,
          });
        }
      }
    }

    if (deductions.length === 0) {
      // No recipe items to deduct — return without touching stock
      return { deducted: 0, items: [] };
    }

    // Aggregate deductions per inventory item (same item may appear in multiple recipes)
    const aggregated = new Map<string, number>();
    for (const d of deductions) {
      aggregated.set(
        d.inventoryItemId,
        (aggregated.get(d.inventoryItemId) || 0) + d.quantity,
      );
    }

    const results: { inventoryItemId: string; deducted: number }[] = [];

    for (const [inventoryItemId, totalQty] of aggregated.entries()) {
      const stock = await prisma.stock.findUnique({
        where: {
          warehouseId_inventoryItemId: {
            warehouseId,
            inventoryItemId,
          },
        },
      });

      if (!stock || Number(stock.quantity) < totalQty) {
        const itemName = inventoryItemId.slice(0, 8);
        throw new BadRequestException(
          `Insufficient stock for item ${itemName}... (need ${totalQty}, have ${stock ? Number(stock.quantity) : 0})`,
        );
      }

      await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: totalQty } },
      });

      await prisma.stockMovement.create({
        data: {
          warehouseId,
          inventoryItemId,
          type: StockMovementType.SALE_CONSUMPTION,
          quantity: -totalQty,
          referenceType: 'ORDER',
          referenceId: orderId,
        },
      });

      results.push({ inventoryItemId, deducted: totalQty });
    }

    return { deducted: results.length, items: results };
  }

  // --------------------------------------------------
  // Stock Restoration for Cancelled Orders
  // --------------------------------------------------
  async restoreStockForOrder(
    orderId: string,
    warehouseId: string,
    tx?: any,
  ) {
    const prisma = tx || this.prisma;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            orderItemModifiers: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ID ${orderId} not found`);
    }

    const restorations: { inventoryItemId: string; quantity: number }[] = [];

    for (const item of order.orderItems) {
      const recipe = await prisma.recipe.findFirst({
        where: { productId: item.productId, isActive: true },
        include: { recipeItems: true },
      });

      if (!recipe) continue;

      for (const recipeItem of recipe.recipeItems) {
        const restoreQty = Number(recipeItem.quantity) * Number(item.quantity);
        restorations.push({
          inventoryItemId: recipeItem.inventoryItemId,
          quantity: restoreQty,
        });
      }

      for (const mod of item.orderItemModifiers) {
        const modifierRecipe = await prisma.modifierRecipeItem.findFirst({
          where: { modifierId: mod.modifierId },
        });

        if (modifierRecipe) {
          const restoreQty =
            Number(modifierRecipe.quantity) * Number(item.quantity);
          restorations.push({
            inventoryItemId: modifierRecipe.inventoryItemId,
            quantity: restoreQty,
          });
        }
      }
    }

    if (restorations.length === 0) {
      return { restored: 0, items: [] };
    }

    const aggregated = new Map<string, number>();
    for (const r of restorations) {
      aggregated.set(
        r.inventoryItemId,
        (aggregated.get(r.inventoryItemId) || 0) + r.quantity,
      );
    }

    const results: { inventoryItemId: string; restored: number }[] = [];

    for (const [inventoryItemId, totalQty] of aggregated.entries()) {
      const stock = await prisma.stock.findUnique({
        where: {
          warehouseId_inventoryItemId: { warehouseId, inventoryItemId },
        },
      });

      if (stock) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: { quantity: { increment: totalQty } },
        });
      } else {
        await prisma.stock.create({
          data: {
            warehouseId,
            inventoryItemId,
            quantity: totalQty,
          },
        });
      }

      await prisma.stockMovement.create({
        data: {
          warehouseId,
          inventoryItemId,
          type: StockMovementType.SALE_REVERSAL,
          quantity: totalQty,
          referenceType: 'ORDER',
          referenceId: orderId,
        },
      });

      results.push({ inventoryItemId, restored: totalQty });
    }

    return { restored: results.length, items: results };
  }

  // --------------------------------------------------
  // Waste Recording
  // --------------------------------------------------
  async recordWaste(userId: string, dto: RecordWasteDto) {
    return this.prisma.$transaction(async (tx) => {
      const waste = await tx.waste.create({
        data: {
          warehouseId: dto.warehouseId,
          recordedById: userId,
          reason: dto.reason,
          occurredAt: new Date(),
          wasteItems: {
            create: dto.items.map((i) => ({
              inventoryItemId: i.inventoryItemId,
              uomId: i.uomId,
              quantity: i.quantity,
            })),
          },
        },
      });

      for (const item of dto.items) {
        const currentStock = await tx.stock.findUnique({
          where: {
            warehouseId_inventoryItemId: {
              warehouseId: dto.warehouseId,
              inventoryItemId: item.inventoryItemId,
            },
          },
        });

        if (!currentStock || Number(currentStock.quantity) < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for item ID ${item.inventoryItemId} in this warehouse`,
          );
        }

        await tx.stock.update({
          where: { id: currentStock.id },
          data: { quantity: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: dto.warehouseId,
            inventoryItemId: item.inventoryItemId,
            type: StockMovementType.WASTE,
            quantity: -item.quantity,
            referenceType: 'WASTE',
            referenceId: waste.id,
          },
        });
      }

      return waste;
    });
  }
}
