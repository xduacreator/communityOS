import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MAX_EXTRA_PAX } from '../../session-wallet/dto/session-wallet.dto';

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

  // Names of additional participants sharing the registrant's contact details
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_EXTRA_PAX)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  participantNames?: string[];
}

export class UpdateGuestStatusDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'WAITLIST'])
  status: string;

  @IsUUID()
  communityId: string;
}
