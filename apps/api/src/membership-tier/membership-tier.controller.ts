import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MembershipTierService } from './membership-tier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import {
  RequireTenantResource,
  RequireTenantRole,
} from '../auth/decorators/roles.decorator';
import {
  CreateMembershipTierDto,
  UpdateMembershipTierDto,
} from './dto/membership-tier.dto';

@Controller('membership-tier')
export class MembershipTierController {
  constructor(private readonly membershipTierService: MembershipTierService) {}

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Post()
  create(@Body() createData: CreateMembershipTierDto) {
    return this.membershipTierService.create(createData);
  }

  @Get()
  findAll(@Query('communityId') communityId: string) {
    return this.membershipTierService.findAll(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('membership')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: UpdateMembershipTierDto) {
    return this.membershipTierService.update(id, updateData);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('membership')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membershipTierService.remove(id);
  }
}
