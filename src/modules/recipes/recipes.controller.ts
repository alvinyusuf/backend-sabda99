import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, CreateModifierRecipeDto } from './dto/recipe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async createRecipe(@Body() dto: CreateRecipeDto) {
    return this.recipesService.createOrUpdateProductRecipe(dto);
  }

  @Get('product/:productId')
  async getRecipeByProduct(@Param('productId') productId: string) {
    return this.recipesService.findRecipeByProduct(productId);
  }

  @Post('modifier-item')
  @Roles('SUPERADMIN', 'MANAGER', 'INVENTORY')
  async addModifierRecipeItem(@Body() dto: CreateModifierRecipeDto) {
    return this.recipesService.addModifierRecipeItem(dto);
  }
}
