import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateTaxDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;
}

export class UpdateTaxDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
