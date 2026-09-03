import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateModifierDto,
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
} from '../dto/modifier.dto';

@Injectable()
export class ModifiersService {
  constructor(private prisma: PrismaService) {}

  async createGroup(dto: CreateModifierGroupDto) {
    return this.prisma.modifierGroup.create({
      data: {
        name: dto.name,
        selectionType: dto.selectionType,
        minSelection: dto.minSelection ?? 0,
        maxSelection: dto.maxSelection ?? 1,
        isRequired: dto.isRequired ?? false,
        modifiers: dto.modifiers
          ? {
              create: dto.modifiers.map((m) => ({
                name: m.name,
                priceAdjustment: m.priceAdjustment ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        modifiers: true,
      },
    });
  }

  async addModifierToGroup(groupId: string, dto: CreateModifierDto) {
    await this.findGroupOne(groupId);
    return this.prisma.modifier.create({
      data: {
        modifierGroupId: groupId,
        name: dto.name,
        priceAdjustment: dto.priceAdjustment ?? 0,
      },
    });
  }

  async findAllGroups() {
    return this.prisma.modifierGroup.findMany({
      include: {
        modifiers: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findGroupOne(id: string) {
    const group = await this.prisma.modifierGroup.findUnique({
      where: { id },
      include: { modifiers: true },
    });

    if (!group) {
      throw new NotFoundException(`Modifier Group with ID ${id} not found`);
    }

    return group;
  }

  async updateGroup(id: string, dto: UpdateModifierGroupDto) {
    await this.findGroupOne(id);
    return this.prisma.modifierGroup.update({
      where: { id },
      data: dto,
      include: { modifiers: true },
    });
  }

  async removeGroup(id: string) {
    await this.findGroupOne(id);
    return this.prisma.modifierGroup.delete({
      where: { id },
    });
  }

  async removeModifier(modifierId: string) {
    const modifier = await this.prisma.modifier.findUnique({
      where: { id: modifierId },
    });

    if (!modifier) {
      throw new NotFoundException(`Modifier with ID ${modifierId} not found`);
    }

    return this.prisma.modifier.delete({
      where: { id: modifierId },
    });
  }
}
