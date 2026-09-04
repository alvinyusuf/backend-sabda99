import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentMethodDto,
  ProcessPaymentDto,
  ConfirmCashPaymentDto,
  RefundPaymentDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Payment Methods Configuration
  @Post('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async createMethod(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentsService.createMethod(dto);
  }

  @Get('methods')
  async getMethods(@Query('outletId') outletId: string) {
    return this.paymentsService.findMethodsByOutlet(outletId);
  }

  // Process / Initiate Payment (Public / Customer or Cashier)
  @Post('process')
  async processPayment(@Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(dto);
  }

  // Cashier Confirmation Endpoint
  @Post('confirm-cash')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER', 'CASHIER')
  async confirmCash(
    @Body() dto: ConfirmCashPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.confirmCashPayment(dto.paymentId, userId);
  }

  // Refund Endpoint
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async refundPayment(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.refundPayment(id, dto, userId);
  }
}
