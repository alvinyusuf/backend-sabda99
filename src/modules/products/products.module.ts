import { Module } from '@nestjs/common';
import { CategoriesService } from './services/categories.service';
import { ModifiersService } from './services/modifiers.service';
import { ProductsService } from './services/products.service';
import { ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController],
  providers: [CategoriesService, ModifiersService, ProductsService],
  exports: [CategoriesService, ModifiersService, ProductsService],
})
export class ProductsModule {}
