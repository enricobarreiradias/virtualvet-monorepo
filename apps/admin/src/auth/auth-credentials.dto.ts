import { IsString, MaxLength, MinLength, IsEmail, IsOptional } from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail({}, { message: 'O email deve ser válido' })
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}