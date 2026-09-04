import { OrderChannel, OrderStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemModifierDto {
  @IsUUID()
  @IsNotEmpty()
  modifierId: string;
}

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  @IsOptional()
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsEnum(OrderChannel)
  @IsOptional()
  channel?: OrderChannel;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
