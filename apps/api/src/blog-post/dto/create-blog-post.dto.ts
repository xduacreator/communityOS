import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';

export class CreateBlogPostDto {
  // Generated from the title when empty; made unique on save
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsString()
  @MaxLength(200000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  cluster?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  featuredImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  metaDescription?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
