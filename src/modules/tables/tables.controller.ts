import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FloorsService } from './services/floors.service';
import { TablesService } from './services/tables.service';
import { CreateFloorDto, UpdateFloorDto } from './dto/floor.dto';
import { CreateTableDto, UpdateTableDto, ResetTableDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pos')
export class TablesController {
  constructor(
    private readonly floorsService: FloorsService,
    private readonly tablesService: TablesService,
  ) {}

  // --------------------------------------------------
  // Public Endpoint: Scan QR Meja dari Customer Mobile
  // --------------------------------------------------
  @Get('customer/table-by-qr')
  async getTableByQr(@Query('qrToken') qrToken: string) {
    return this.tablesService.findByQrToken(qrToken);
  }

  // --------------------------------------------------
  // Floor Management Endpoints
  // --------------------------------------------------
  @Post('floors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async createFloor(@Body() dto: CreateFloorDto) {
    return this.floorsService.create(dto);
  }

  @Get('floors')
  @UseGuards(JwtAuthGuard)
  async getFloors(@Query('outletId') outletId: string) {
    return this.floorsService.findAllByOutlet(outletId);
  }

  @Put('floors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async updateFloor(@Param('id') id: string, @Body() dto: UpdateFloorDto) {
    return this.floorsService.update(id, dto);
  }

  @Put('floors/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async toggleFloor(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.floorsService.toggleActive(id, isActive);
  }

  // --------------------------------------------------
  // Table Management Endpoints
  // --------------------------------------------------
  @Post('tables')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async createTable(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Get('tables')
  @UseGuards(JwtAuthGuard)
  async getTables(@Query('outletId') outletId: string) {
    return this.tablesService.findAllByOutlet(outletId);
  }

  @Get('tables/:id')
  @UseGuards(JwtAuthGuard)
  async getTable(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Put('tables/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async updateTable(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Post('tables/:id/regenerate-qr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async regenerateQr(@Param('id') id: string) {
    return this.tablesService.regenerateQrToken(id);
  }

  @Put('tables/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async toggleTable(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.tablesService.toggleActive(id, isActive);
  }

  @Post('tables/:id/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER', 'CASHIER')
  async resetTable(
    @Param('id') id: string,
    @Body() dto: ResetTableDto,
    @CurrentUser() user: any,
  ) {
    return this.tablesService.resetTable(id, dto, user);
  }
}
