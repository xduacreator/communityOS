import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const MAX_EXTRA_PAX = 5;

export class PurchasePackageDto {
  @IsUUID()
  communityId: string;

  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsUUID()
  userMembershipId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentProofUrl?: string;

  @IsOptional()
  @IsUUID()
  promoVoucherId?: string;

  // Names of additional participants (the buyer is always pax 1)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_EXTRA_PAX)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  participantNames?: string[];
}

export class PurchaseBundleDto extends PurchasePackageDto {
  @IsUUID()
  membershipId: string;

  @IsString()
  @MaxLength(500)
  declare paymentProofUrl: string;
}

export class MemberAttendanceDto {
  @IsUUID()
  communityId: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  // Targets one wallet, e.g. an extra pax; defaults to the user's own wallet
  @IsOptional()
  @IsUUID()
  walletId?: string;
}

export class CoachCheckInDto extends MemberAttendanceDto {
  @IsUUID()
  userId: string;
}

export class FreezeWalletDto {
  @IsUUID()
  walletId: string;

  @IsInt()
  @Min(1)
  @Max(365)
  days: number;

  @IsString()
  @MaxLength(500)
  reason: string;
}
