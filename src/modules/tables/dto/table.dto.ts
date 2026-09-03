import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTableDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsUUID()
  @IsNotEmpty()
  floorId: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}

export class UpdateTableDto {
  @IsUUID()
  @IsOptional()
  floorId?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
