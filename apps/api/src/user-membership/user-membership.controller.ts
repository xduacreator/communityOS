import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { UserMembershipService } from './user-membership.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { RequireTenantRole } from '../auth/decorators/roles.decorator';

@Controller('user-membership')
export class UserMembershipController {
  constructor(private readonly userMembershipService: UserMembershipService) {}

  @Post()
  create(@Body() createData: any) {
    return this.userMembershipService.create({
      ...createData,
      startDate: createData.startDate ? new Date(createData.startDate) : undefined,
      endDate: createData.endDate ? new Date(createData.endDate) : undefined,
    });
  }

  @Get('active/:userId')
  findActiveByUser(@Param('userId') userId: string, @Query('communityId') communityId: string) {
    return this.userMembershipService.findActiveByUser(userId, communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('pending/:communityId')
  findPendingByCommunity(@Param('communityId') communityId: string) {
    return this.userMembershipService.findPendingByCommunity(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Patch('approve/:id')
  approve(@Param('id') id: string) {
    return this.userMembershipService.approve(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.userMembershipService.update(id, updateData);
  }
}
