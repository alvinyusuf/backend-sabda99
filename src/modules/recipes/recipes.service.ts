import { Injectable, NotFoundException } from '@nestjs/common';
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
}
