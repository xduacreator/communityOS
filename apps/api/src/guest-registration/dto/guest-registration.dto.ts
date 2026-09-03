import {
  IsEmail,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitGuestRegistrationDto {
  @IsUUID()
  communityId: string;

  @IsUUID()
  packageId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  address: string;
}

export class UpdateGuestStatusDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'WAITLIST'])
  status: string;

  @IsUUID()
  communityId: string;
}
