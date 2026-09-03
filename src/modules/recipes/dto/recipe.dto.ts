import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeItemDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsUUID()
  @IsNotEmpty()
  uomId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

export class CreateRecipeDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  @IsNotEmpty()
  items: RecipeItemDto[];
}

export class CreateModifierRecipeDto {
  @IsUUID()
  @IsNotEmpty()
  modifierId: string;

  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsUUID()
  @IsNotEmpty()
  uomId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;
}
