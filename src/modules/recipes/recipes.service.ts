import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { isRegisteredUom } from '../inventory/inventory-uom.util';
import { PrismaService } from '../../database/prisma.service';
import { CreateRecipeDto, CreateModifierRecipeDto } from './dto/recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateProductRecipe(dto: CreateRecipeDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ID ${dto.productId} not found`);
    }

    await this.assertRecipeItemsUseRegisteredUom(dto.items);

    // Check existing active recipe
    const existingRecipe = await this.prisma.recipe.findFirst({
      where: { productId: dto.productId, isActive: true },
    });

    return this.prisma.$transaction(async (tx) => {
      let version = 1;
      if (existingRecipe) {
        version = existingRecipe.version + 1;
        await tx.recipe.update({
          where: { id: existingRecipe.id },
          data: { isActive: false },
        });
      }

      const newRecipe = await tx.recipe.create({
        data: {
          productId: dto.productId,
          version,
          isActive: true,
          recipeItems: {
            create: dto.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              uomId: item.uomId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          recipeItems: {
            include: {
              inventoryItem: true,
              uom: true,
            },
          },
        },
      });

      return newRecipe;
    });
  }

  async findRecipeByProduct(productId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { productId, isActive: true },
      include: {
        recipeItems: {
          include: {
            inventoryItem: true,
            uom: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`No active recipe found for Product ID ${productId}`);
    }

    return recipe;
  }

  async addModifierRecipeItem(dto: CreateModifierRecipeDto) {
    await this.assertRecipeItemsUseRegisteredUom([dto]);

    return this.prisma.modifierRecipeItem.create({
      data: {
        modifierId: dto.modifierId,
        inventoryItemId: dto.inventoryItemId,
        uomId: dto.uomId,
        quantity: dto.quantity,
      },
      include: {
        inventoryItem: true,
        uom: true,
      },
    });
  }

  private async assertRecipeItemsUseRegisteredUom(
    items: { inventoryItemId: string; uomId: string }[],
  ) {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: items.map((item) => item.inventoryItemId) } },
    });
    const inventoryItemById = new Map(inventoryItems.map((item) => [item.id, item]));

    for (const item of items) {
      const inventoryItem = inventoryItemById.get(item.inventoryItemId);
      if (!inventoryItem) {
        throw new NotFoundException(
          `Inventory Item ID ${item.inventoryItemId} not found`,
        );
      }
      if (!isRegisteredUom(inventoryItem, item.uomId)) {
        throw new BadRequestException(
          `UoM ${item.uomId} tidak terdaftar untuk item ${inventoryItem.name} (harus salah satu dari UoM Dasar/Beli/Resep item)`,
        );
      }
    }
  }
}
