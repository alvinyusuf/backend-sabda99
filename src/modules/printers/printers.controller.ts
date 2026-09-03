import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrintersService } from './printers.service';
import { CreatePrinterDto, GenerateKotDto } from './dto/printer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('printers')
@UseGuards(JwtAuthGuard)
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async createPrinter(@Body() dto: CreatePrinterDto) {
    return this.printersService.createPrinter(dto);
  }

  @Get()
  async getPrinters(@Query('outletId') outletId: string) {
    return this.printersService.findPrintersByOutlet(outletId);
  }

  @Post('generate-kot')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER', 'CASHIER')
  async generateKot(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateKotDto,
  ) {
    return this.printersService.generateKot(userId, dto);
  }
}
