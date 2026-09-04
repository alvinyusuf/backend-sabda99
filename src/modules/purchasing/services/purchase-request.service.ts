import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
} from '../dto/purchase-request.dto';

@Injectable()
export class PurchaseRequestService {
  constructor(private prisma: PrismaService) {}

  private generatePrNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PR-${dateStr}-${randomSuffix}`;
  }

  async create(userId: string, dto: CreatePurchaseRequestDto) {
    return this.prisma.purchaseRequest.create({
      data: {
        outletId: dto.outletId,
        requestedBy: userId,
        status: 'PENDING',
        purchaseRequestItems: {
          create: dto.items.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            uomId: i.uomId,
            quantity: i.quantity,
          })),
        },
      },
      include: {
        requester: true,
        purchaseRequestItems: {
          include: {
            inventoryItem: true,
            uom: true,
          },
        },
      },
    });
  }

  async findAll(outletId: string) {
    return this.prisma.purchaseRequest.findMany({
      where: { outletId },
      include: {
        requester: true,
        purchaseRequestItems: {
          include: {
            inventoryItem: true,
            uom: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requester: true,
        purchaseRequestItems: {
          include: {
            inventoryItem: true,
            uom: true,
          },
        },
        purchaseOrders: true,
      },
    });

    if (!pr) {
      throw new NotFoundException(`Purchase Request ID ${id} not found`);
    }

    return pr;
  }

  async updateStatus(id: string, dto: UpdatePurchaseRequestDto) {
    const pr = await this.findOne(id);

    if (pr.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot update status of a ${pr.status} purchase request`
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status. Must be APPROVED or REJECTED`
      );
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: dto.status },
      include: {
        requester: true,
        purchaseRequestItems: {
          include: {
            inventoryItem: true,
            uom: true,
          },
        },
      },
    });
  }
}
