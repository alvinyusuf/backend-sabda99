import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @IsString()
  @IsNotEmpty()
  roleName: string;
}
