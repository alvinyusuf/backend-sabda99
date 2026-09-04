import { PaymentMethodType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentMethodDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  type: PaymentMethodType;
}

export class ProcessPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsUUID()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class ConfirmCashPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;
}
