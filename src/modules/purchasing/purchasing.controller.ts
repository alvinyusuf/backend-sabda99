import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
} from './dto/purchasing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('purchasing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  // Suppliers
  @Post('suppliers')
  @Roles('SUPERADMIN', 'MANAGER', 'PURCHASING')
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.purchasingService.createSupplier(dto);
  }

  @Get('suppliers')
  async getSuppliers() {
    return this.purchasingService.findAllSuppliers();
  }

  // Purchase Orders
  @Post('orders')
  @Roles('SUPERADMIN', 'MANAGER', 'PURCHASING')
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchasingService.createPurchaseOrder(dto);
  }

  @Get('orders')
  async getPurchaseOrders(@Query('outletId') outletId: string) {
    return this.purchasingService.findAllPurchaseOrders(outletId);
  }

  // Goods Receipts
  @Post('goods-receipts')
  @Roles('SUPERADMIN', 'MANAGER', 'PURCHASING')
  async createGoodsReceipt(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGoodsReceiptDto,
  ) {
    return this.purchasingService.createGoodsReceipt(userId, dto);
  }
}
