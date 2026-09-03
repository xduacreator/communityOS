import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional() @IsEmail() @MaxLength(254) adminEmail?: string;
  @IsOptional() @IsString() @MaxLength(100) adminName?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(128) adminPassword?: string;
  @IsOptional() @IsString() @MaxLength(253) domain?: string;
  @IsOptional() @IsIn(['FREE', 'PAID']) registrationMode?: string;
  @IsOptional() @IsBoolean() isShowcase?: boolean;
  @IsOptional() @IsString() @MaxLength(50000) registrationFields?: string;
  @IsOptional() @IsString() @MaxLength(5000) about?: string;
  @IsOptional() @IsString() @MaxLength(5000) contactInfo?: string;
  @IsOptional() @IsString() @MaxLength(5000) paymentInstructions?: string;
  @IsOptional() @IsString() @MaxLength(500) logo?: string;
  @IsOptional() @IsString() @MaxLength(500) heroBanner?: string;
  @IsOptional() @IsString() @MaxLength(500) qrisImageUrl?: string;
  @IsOptional() @IsString() @MaxLength(50) whatsappNumber?: string;
  @IsOptional() @IsString() @MaxLength(10000) theme?: string;
  @IsOptional() @IsString() @MaxLength(300) tagline?: string;
  @IsOptional() @IsString() @MaxLength(1000) shortDescription?: string;
  @IsOptional() @IsString() @MaxLength(500) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(1000) seoDescription?: string;
  @IsOptional() @IsString() @MaxLength(1000) seoKeywords?: string;
  @IsOptional() @IsString() @MaxLength(100) statMembersValue?: string;
  @IsOptional() @IsString() @MaxLength(100) statEventsValue?: string;
  @IsOptional() @IsString() @MaxLength(100) statCitiesValue?: string;
  @IsOptional() @IsString() @MaxLength(100) statAchievementsValue?: string;
  @IsOptional() @IsString() @MaxLength(1000) welcomeMessage?: string;
  @IsOptional() @IsString() @MaxLength(100) joinCtaLabel?: string;
  @IsOptional() @IsString() @MaxLength(100) menuHomeLabel?: string;
  @IsOptional() @IsString() @MaxLength(100) menuEventsLabel?: string;
  @IsOptional() @IsString() @MaxLength(100) menuGalleryLabel?: string;
  @IsOptional() @IsString() @MaxLength(100) menuAboutLabel?: string;
  @IsOptional() @IsString() @MaxLength(100) menuContactLabel?: string;
  @IsOptional() @IsString() @MaxLength(100) packagesHeadingLabel?: string;
}
