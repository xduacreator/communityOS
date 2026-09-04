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

export class CreateSessionPackageDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  totalSession: number;

  @IsInt()
  @Min(1)
  @Max(3650)
  validDays: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  memberPrice: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vipPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  quota?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  privateQuota?: number;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @IsOptional()
  @IsIn(['PUBLIC', 'MEMBER_ONLY'])
  accessRule?: string;
}

export class UpdateSessionPackageDto extends PartialType(
  CreateSessionPackageDto,
) {}
