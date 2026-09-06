import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'MANAGER')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getAuditLogs(
    @Query('outletId') outletId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.auditLogService.findAll({ outletId, userId, action, entityType });
  }
}
