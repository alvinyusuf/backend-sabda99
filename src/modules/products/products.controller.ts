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
import { CategoriesService } from './services/categories.service';
import { ModifiersService } from './services/modifiers.service';
import { ProductsService } from './services/products.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  CreateModifierDto,
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
} from './dto/modifier.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class ProductsController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly modifiersService: ModifiersService,
    private readonly productsService: ProductsService,
  ) {}

  // --------------------------------------------------
  // Public Catalog Endpoint (for Customer Mobile App)
  // --------------------------------------------------
  @Get('customer/catalog')
  async getPublicCatalog() {
    return this.categoriesService.findAll();
  }

  // --------------------------------------------------
  // Category Endpoints
  // --------------------------------------------------
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  async getCategories() {
    return this.categoriesService.findAll();
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async removeCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // --------------------------------------------------
  // Modifier Group & Item Endpoints
  // --------------------------------------------------
  @Post('modifier-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async createModifierGroup(@Body() dto: CreateModifierGroupDto) {
    return this.modifiersService.createGroup(dto);
  }

  @Get('modifier-groups')
  @UseGuards(JwtAuthGuard)
  async getModifierGroups() {
    return this.modifiersService.findAllGroups();
  }

  @Post('modifier-groups/:id/modifiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async addModifierToGroup(
    @Param('id') groupId: string,
    @Body() dto: CreateModifierDto,
  ) {
    return this.modifiersService.addModifierToGroup(groupId, dto);
  }

  @Put('modifier-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async updateModifierGroup(
    @Param('id') id: string,
    @Body() dto: UpdateModifierGroupDto,
  ) {
    return this.modifiersService.updateGroup(id, dto);
  }

  @Delete('modifier-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async removeModifierGroup(@Param('id') id: string) {
    return this.modifiersService.removeGroup(id);
  }

  @Delete('modifiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async removeModifier(@Param('id') id: string) {
    return this.modifiersService.removeModifier(id);
  }

  // --------------------------------------------------
  // Product Endpoints
  // --------------------------------------------------
  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  async getProducts(@Query('categoryId') categoryId?: string) {
    return this.productsService.findAll(categoryId);
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'MANAGER')
  async removeProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
