import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogParams {
  outletId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          outletId: params.outletId,
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata || {},
        },
      });
    } catch (error) {
      // Audit log failures should not break the main operation
      this.logger.error(`Failed to write audit log: ${error.message}`);
    }
  }

  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    userId?: string,
    outletId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.log({
      action,
      entityType,
      entityId,
      userId,
      outletId,
      metadata,
    });
  }

  async findAll(query?: { outletId?: string; userId?: string; action?: string; entityType?: string }) {
    const where: any = {};
    if (query?.outletId) where.outletId = query.outletId;
    if (query?.userId) where.userId = query.userId;
    if (query?.action) where.action = query.action;
    if (query?.entityType) where.entityType = query.entityType;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
