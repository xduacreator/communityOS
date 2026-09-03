import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UserMembershipService } from './user-membership.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequireSuperAdmin, RequireTenantResource, RequireTenantRole } from '../auth/decorators/roles.decorator';

@Controller('user-membership')
export class UserMembershipController {
  constructor(private readonly userMembershipService: UserMembershipService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() createData: any) {
    return this.userMembershipService.create({
      userId: req.user.userId,
      communityId: createData.communityId,
      membershipId: createData.membershipId,
      paymentProofUrl: createData.paymentProofUrl,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('active/:userId')
  findActiveByUser(@Request() req: any, @Query('communityId') communityId: string) {
    return this.userMembershipService.findActiveByUser(req.user.userId, communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('pending/:communityId')
  findPendingByCommunity(@Param('communityId') communityId: string) {
    return this.userMembershipService.findPendingByCommunity(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('userMembership')
  @Patch('approve/:id')
  approve(@Param('id') id: string) {
    return this.userMembershipService.approve(id);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('userMembership')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.userMembershipService.update(id, updateData);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('debug/db-status')
  async debugDbStatus() {
    return this.userMembershipService.debugDbStatus();
  }
}
