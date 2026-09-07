import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCogs(outletId: string) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { outletId, isActive: true },
      select: { id: true },
    });
    const warehouseIds = warehouses.map((w) => w.id);

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        recipes: {
          where: { isActive: true },
          include: {
            recipeItems: {
              include: { inventoryItem: true },
            },
          },
        },
      },
    });

    const cogsPerProduct = products.map((product) => {
      let cogsPerUnit = 0;

      for (const recipe of product.recipes) {
        for (const recipeItem of recipe.recipeItems) {
          cogsPerUnit += Number(recipeItem.quantity) * Number(recipeItem.inventoryItem.cost);
        }
      }

      return {
        productId: product.id,
        productName: product.name,
        cogsPerUnit,
        totalCOGS: 0,
      };
    });

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          outletId,
          status: { in: ['CONFIRMED', 'SERVED', 'COMPLETED'] },
        },
      },
      select: { productId: true, quantity: true },
    });

    const quantitySold = new Map<string, number>();
    for (const item of orderItems) {
      quantitySold.set(
        item.productId,
        (quantitySold.get(item.productId) || 0) + Number(item.quantity),
      );
    }

    const result = cogsPerProduct
      .map((p) => ({
        ...p,
        totalCOGS: p.cogsPerUnit * (quantitySold.get(p.productId) || 0),
      }))
      .filter((p) => p.cogsPerUnit > 0);

    return { products: result };
  }
}
