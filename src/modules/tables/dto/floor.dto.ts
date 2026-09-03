import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFloorDto {
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFloorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
