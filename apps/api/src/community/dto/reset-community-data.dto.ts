import { ArrayMaxSize, IsArray, IsIn } from 'class-validator';

export class ResetCommunityDataDto {
  @IsArray()
  @ArrayMaxSize(6)
  @IsIn(['TRANSACTIONS', 'MEMBERS', 'PACKAGES', 'EVENTS', 'GALLERY', 'MEMBERSHIPS'], { each: true })
  options: string[];
}
