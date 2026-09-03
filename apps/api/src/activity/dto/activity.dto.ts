import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateActivityDto {
  @IsUUID()
  communityId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class CreateCategoryDto {
  @IsUUID()
  activityId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  maxAge?: number;
}
