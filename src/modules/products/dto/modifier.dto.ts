import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateModifierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceAdjustment?: number;
}

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  selectionType: string; // SINGLE / MULTIPLE

  @IsInt()
  @Min(0)
  @IsOptional()
  minSelection?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxSelection?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsArray()
  @IsOptional()
  modifiers?: CreateModifierDto[];
}

export class UpdateModifierGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  selectionType?: string;

  @IsInt()
  @IsOptional()
  minSelection?: number;

  @IsInt()
  @IsOptional()
  maxSelection?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}
