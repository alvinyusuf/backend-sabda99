import { InventoryItemType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUomDto {
  @IsString()
  @IsNotEmpty()
  code: string; // e.g. KG, GRAM, ML, LITER, PCS

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string; // WEIGHT, VOLUME, COUNT
}

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(InventoryItemType)
  @IsNotEmpty()
  itemType: InventoryItemType;

  @IsUUID()
  @IsNotEmpty()
  uomId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;
}

export class CreateWarehouseDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TransferStockItemDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class CreateStockTransferDto {
  @IsUUID()
  @IsNotEmpty()
  fromWarehouseId: string;

  @IsUUID()
  @IsNotEmpty()
  toWarehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferStockItemDto)
  @IsNotEmpty()
  items: TransferStockItemDto[];
}

export class StockOpnameItemDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  @Min(0)
  actualQuantity: number;
}

export class CreateStockOpnameDto {
  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockOpnameItemDto)
  @IsNotEmpty()
  items: StockOpnameItemDto[];
}

export class WasteItemDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsUUID()
  @IsNotEmpty()
  uomId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class RecordWasteDto {
  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WasteItemDto)
  @IsNotEmpty()
  items: WasteItemDto[];
}
