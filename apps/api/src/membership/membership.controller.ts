import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequireTenantRole, RequireSuperAdmin } from '../auth/decorators/roles.decorator';

@Controller('memberships')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @UseGuards(JwtAuthGuard)
  @Post('join')
  joinCommunity(@Request() req: any, @Body() data: { communityId: string; customFieldsData?: string }) {
    return this.membershipService.joinCommunity(req.user.userId, data.communityId, data.customFieldsData);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('community/:communityId')
  getMembers(@Param('communityId') communityId: string) {
    return this.membershipService.getMembers(communityId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-status/:slug')
  getMyStatus(@Request() req: any, @Param('slug') slug: string) {
    return this.membershipService.getMyStatus(req.user.userId, slug);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: { status: any, communityId: string }) {
    return this.membershipService.updateStatus(id, data.status);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Patch(':id')
  updateMember(@Param('id') id: string, @Body() data: { role?: any, name?: string, email?: string, customFieldsData?: string, communityId: string }) {
    const { communityId, ...updateData } = data;
    return this.membershipService.updateMember(id, updateData);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Delete(':id')
  deleteMember(@Param('id') id: string, @Body() data: { communityId: string }) {
    return this.membershipService.deleteMember(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('confirm-payment/:id')
  confirmPayment(@Param('id') id: string, @Body() data: { paymentProofUrl: string }) {
    return this.membershipService.updateMember(id, { paymentProofUrl: data.paymentProofUrl });
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('all')
  getAllMembers() {
    return this.membershipService.getAllMembers();
  }
}
