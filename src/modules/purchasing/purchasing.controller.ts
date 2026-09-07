import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PurchaseRequestService } from './services/purchase-request.service';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
} from './dto/purchasing.dto';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
} from './dto/purchase-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('purchasing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasingController {
  constructor(
    private readonly purchasingService: PurchasingService,
    private readonly purchaseRequestService: PurchaseRequestService,
  ) {}

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

  @Put('suppliers/:id')
  @Roles('SUPERADMIN', 'MANAGER', 'PURCHASING')
  async updateSupplier(@Param('id') id: string, @Body() dto: { name?: string; contact?: string; address?: string; paymentTerms?: string }) {
    return this.purchasingService.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  @Roles('SUPERADMIN', 'MANAGER', 'PURCHASING')
  async deleteSupplier(@Param('id') id: string) {
    return this.purchasingService.deleteSupplier(id);
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

  // Purchase Requests
  @Post('requests')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY', 'PURCHASING')
  async createPurchaseRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.purchaseRequestService.create(userId, dto);
  }

  @Get('requests')
  async getPurchaseRequests(@Query('outletId') outletId: string) {
    return this.purchaseRequestService.findAll(outletId);
  }

  @Get('requests/:id')
  async getPurchaseRequest(@Param('id') id: string) {
    return this.purchaseRequestService.findOne(id);
  }

  @Put('requests/:id')
  @Roles('SUPERADMIN', 'MANAGER')
  async updatePurchaseRequest(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseRequestDto,
  ) {
    return this.purchaseRequestService.updateStatus(id, dto);
  }
}
