import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;
}

export class PurchaseOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  @IsNotEmpty()
  items: PurchaseOrderItemDto[];
}

export class GoodsReceiptItemDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  @Min(0)
  orderedQuantity: number;

  @IsNumber()
  @Min(0.001)
  receivedQuantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  @IsNotEmpty()
  purchaseOrderId: string;

  @IsUUID()
  @IsNotEmpty()
  warehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  @IsNotEmpty()
  items: GoodsReceiptItemDto[];
}
