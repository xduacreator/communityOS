import { IsString, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomPageDto {
  @ApiProperty({ description: 'URL friendly slug for the page' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({ description: 'Title of the page' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'HTML content of the page' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether the page is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
