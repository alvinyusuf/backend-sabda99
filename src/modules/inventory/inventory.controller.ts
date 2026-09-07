import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateUomDto,
  CreateInventoryItemDto,
  CreateWarehouseDto,
  CreateStockTransferDto,
  CreateStockOpnameDto,
  RecordWasteDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Inventory Dashboard
  @Get('dashboard')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async getDashboard(@Query('outletId') outletId: string) {
    return this.inventoryService.getDashboard(outletId);
  }

  // UOM Endpoints
  @Post('uoms')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async createUom(@Body() dto: CreateUomDto) {
    return this.inventoryService.createUom(dto);
  }

  @Put('uoms/:id')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async updateUom(@Param('id') id: string, @Body() dto: { code?: string; name?: string; type?: string }) {
    return this.inventoryService.updateUom(id, dto);
  }

  @Delete('uoms/:id')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async deleteUom(@Param('id') id: string) {
    return this.inventoryService.deleteUom(id);
  }

  @Get('uoms')
  async getUoms() {
    return this.inventoryService.findAllUoms();
  }

  // Inventory Items Endpoints
  @Post('items')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createInventoryItem(dto);
  }

  @Put('items/:id')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async updateItem(@Param('id') id: string, @Body() dto: Partial<CreateInventoryItemDto>) {
    return this.inventoryService.updateInventoryItem(id, dto);
  }

  @Delete('items/:id')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async deleteItem(@Param('id') id: string) {
    return this.inventoryService.deleteInventoryItem(id);
  }

  @Get('items')
  async getItems() {
    return this.inventoryService.findAllInventoryItems();
  }

  // Warehouse & Stock Balance
  @Post('warehouses')
  @Roles('SUPERADMIN', 'MANAGER')
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }

  @Put('warehouses/:id')
  @Roles('SUPERADMIN', 'MANAGER')
  async updateWarehouse(@Param('id') id: string, @Body() dto: { name?: string; code?: string }) {
    return this.inventoryService.updateWarehouse(id, dto);
  }

  @Delete('warehouses/:id')
  @Roles('SUPERADMIN', 'MANAGER')
  async deleteWarehouse(@Param('id') id: string) {
    return this.inventoryService.deleteWarehouse(id);
  }

  @Get('warehouses')
  async getWarehouses(@Query('outletId') outletId: string) {
    return this.inventoryService.findWarehousesByOutlet(outletId);
  }

  @Get('stock')
  async getStock(@Query('warehouseId') warehouseId: string) {
    return this.inventoryService.getWarehouseStock(warehouseId);
  }

  @Get('movements')
  async getMovements(
    @Query('warehouseId') warehouseId?: string,
    @Query('inventoryItemId') inventoryItemId?: string,
  ) {
    return this.inventoryService.getStockMovements(
      warehouseId,
      inventoryItemId,
    );
  }

  // Operational Actions: Transfer, Opname, Waste
  @Post('transfers')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async transferStock(@Body() dto: CreateStockTransferDto) {
    return this.inventoryService.transferStock(dto);
  }

  @Post('opnames')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async performOpname(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStockOpnameDto,
  ) {
    return this.inventoryService.performStockOpname(userId, dto);
  }

  @Post('waste')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async recordWaste(
    @CurrentUser('id') userId: string,
    @Body() dto: RecordWasteDto,
  ) {
    return this.inventoryService.recordWaste(userId, dto);
  }
}
