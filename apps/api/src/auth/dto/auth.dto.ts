import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}

export class RegisterDto extends LoginDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @MinLength(8)
  declare password: string;

  // Kept for compatibility with the community registration form. It is not
  // persisted on the account and is only accepted as a bounded string.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}
