import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('taxes')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async create(@Body() dto: CreateTaxDto) {
    return this.taxService.create(dto);
  }

  @Get()
  async findAll(@Query('outletId') outletId: string) {
    return this.taxService.findAllByOutlet(outletId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async update(@Param('id') id: string, @Body() dto: UpdateTaxDto) {
    return this.taxService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async delete(@Param('id') id: string) {
    return this.taxService.delete(id);
  }
}
