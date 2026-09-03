import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderChannel, OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --------------------------------------------------
  // Public Endpoint: Submit Order from Customer App
  // --------------------------------------------------
  @Post('customer/submit')
  async submitCustomerOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  // --------------------------------------------------
  // Public Endpoint: Track Order Status by Order Number
  // --------------------------------------------------
  @Get('customer/track/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  // --------------------------------------------------
  // Staff / POS Endpoints
  // --------------------------------------------------
  @Post()
  @UseGuards(JwtAuthGuard)
  async createDirectOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getOrders(
    @Query('outletId') outletId: string,
    @Query('status') status?: OrderStatus,
    @Query('channel') channel?: OrderChannel,
  ) {
    return this.ordersService.findAll(outletId, status, channel);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER', 'CASHIER')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
