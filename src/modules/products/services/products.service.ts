import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });

    if (existingSku) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }

    return this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        image: dto.image,
        productModifierGroups: dto.modifierGroupIds
          ? {
              create: dto.modifierGroupIds.map((groupId) => ({
                modifierGroupId: groupId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        productModifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(categoryId?: string) {
    return this.prisma.product.findMany({
      where: categoryId ? { categoryId, isActive: true } : { isActive: true },
      include: {
        category: true,
        productModifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        productModifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
        recipes: {
          include: {
            recipeItems: {
              include: {
                inventoryItem: true,
                uom: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    // If modifierGroupIds is explicitly supplied, replace associations
    if (dto.modifierGroupIds !== undefined) {
      await this.prisma.productModifierGroup.deleteMany({
        where: { productId: id },
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        image: dto.image,
        isActive: dto.isActive,
        productModifierGroups:
          dto.modifierGroupIds !== undefined
            ? {
                create: dto.modifierGroupIds.map((groupId) => ({
                  modifierGroupId: groupId,
                })),
              }
            : undefined,
      },
      include: {
        category: true,
        productModifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
