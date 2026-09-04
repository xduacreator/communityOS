import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGalleryImageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string;
}
