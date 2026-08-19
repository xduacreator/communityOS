import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateLandingPageDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  h1: string;

  @IsOptional()
  @IsString()
  targetKeywords?: string;

  @IsOptional()
  @IsString()
  summaryParagraph?: string;

  @IsOptional()
  @IsString()
  faqContent?: string;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
