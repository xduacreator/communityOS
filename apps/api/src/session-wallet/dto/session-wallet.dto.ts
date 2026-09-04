import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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
