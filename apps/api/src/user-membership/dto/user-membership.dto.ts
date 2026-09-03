import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateUserMembershipDto {
  @IsUUID()
  communityId: string;

  @IsUUID()
  membershipId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentProofUrl?: string;
}

export class UpdateUserMembershipDto {
  @IsOptional()
  @IsIn(['PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED'])
  status?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentProofUrl?: string;
}
