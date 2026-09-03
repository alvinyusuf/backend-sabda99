import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import {
  OpenShiftDto,
  CreateCashMovementDto,
  CloseShiftDto,
} from './dto/shift.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'MANAGER', 'CASHIER')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('open')
  async openShift(
    @CurrentUser('id') userId: string,
    @Body() dto: OpenShiftDto,
  ) {
    return this.shiftsService.openShift(userId, dto);
  }

  @Get('current')
  async getCurrentShift(@CurrentUser('id') userId: string) {
    return this.shiftsService.getCurrentShift(userId);
  }

  @Post('cash-movement')
  async recordCashMovement(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCashMovementDto,
  ) {
    return this.shiftsService.recordCashMovement(userId, dto);
  }

  @Post(':id/close')
  async closeShift(
    @Param('id') shiftId: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.shiftsService.closeShift(shiftId, dto);
  }
}
