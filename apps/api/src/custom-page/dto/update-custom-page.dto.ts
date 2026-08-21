import { PartialType } from '@nestjs/swagger';
import { CreateCustomPageDto } from './create-custom-page.dto';

export class UpdateCustomPageDto extends PartialType(CreateCustomPageDto) {}
