import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class OpenShiftDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsNumber()
  @Min(0)
  openingCash: number;
}

export class CreateCashMovementDto {
  @IsUUID()
  @IsNotEmpty()
  shiftId: string;

  @IsString()
  @IsNotEmpty()
  type: string; // CASH_IN, CASH_OUT

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CloseShiftDto {
  @IsNumber()
  @Min(0)
  actualCash: number;
}
