import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class OpenTableSessionDto {
  @IsUUID()
  @IsNotEmpty()
  tableId: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  guestCount?: number;
}
