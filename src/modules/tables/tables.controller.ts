import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FloorsService } from './services/floors.service';
import { TablesService } from './services/tables.service';
import { TableSessionsService } from './services/table-sessions.service';
import { CreateFloorDto, UpdateFloorDto } from './dto/floor.dto';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { OpenTableSessionDto } from './dto/table-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('pos')
export class TablesController {
  constructor(
    private readonly floorsService: FloorsService,
    private readonly tablesService: TablesService,
    private readonly tableSessionsService: TableSessionsService,
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

  @Delete('floors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async removeFloor(@Param('id') id: string) {
    return this.floorsService.remove(id);
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

  @Delete('tables/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async removeTable(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }

  // --------------------------------------------------
  // Table Session Endpoints
  // --------------------------------------------------
  @Post('table-sessions/open')
  @UseGuards(JwtAuthGuard)
  async openSession(@Body() dto: OpenTableSessionDto) {
    return this.tableSessionsService.openSession(dto);
  }

  @Get('table-sessions/active/:tableId')
  @UseGuards(JwtAuthGuard)
  async getActiveSession(@Param('tableId') tableId: string) {
    return this.tableSessionsService.getActiveSessionByTable(tableId);
  }

  @Post('table-sessions/:id/close')
  @UseGuards(JwtAuthGuard)
  async closeSession(@Param('id') id: string) {
    return this.tableSessionsService.closeSession(id);
  }
}
