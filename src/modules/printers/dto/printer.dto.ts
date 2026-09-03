import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePrinterDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string; // KITCHEN, CASHIER, BAR

  @IsString()
  @IsNotEmpty()
  address: string; // IP or USB path
}

export class GenerateKotDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsUUID()
  @IsOptional()
  printerId?: string;
}
