import { PartialType } from '@nestjs/mapped-types';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMembershipTierDto {
  @IsUUID()
  communityId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  benefit?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class UpdateMembershipTierDto extends PartialType(
  CreateMembershipTierDto,
) {}
