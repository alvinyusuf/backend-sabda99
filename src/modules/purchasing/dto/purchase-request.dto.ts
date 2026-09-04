import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseRequestItemDto {
  @IsString()
  inventoryItemId: string;

  @IsString()
  uomId: string;

  @IsNumber()
  quantity: number;
}

export class CreatePurchaseRequestDto {
  @IsString()
  outletId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseRequestItemDto)
  items: CreatePurchaseRequestItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePurchaseRequestDto {
  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
