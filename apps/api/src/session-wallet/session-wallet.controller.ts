import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { SessionWalletService } from './session-wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequireTenantRole, RequireSuperAdmin } from '../auth/decorators/roles.decorator';

@Controller('session-wallet')
export class SessionWalletController {
  constructor(private readonly sessionWalletService: SessionWalletService) {}

  @Post('purchase')
  purchasePackage(@Body() body: { userId: string; communityId: string; packageId: string; isPrivate?: boolean; userMembershipId?: string; paymentProofUrl?: string }) {
    return this.sessionWalletService.purchasePackage(body.userId, body.communityId, body.packageId, body.isPrivate, body.userMembershipId, body.paymentProofUrl);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('pending/:communityId')
  findPendingByCommunity(@Param('communityId') communityId: string) {
    return this.sessionWalletService.findPendingByCommunity(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Patch('approve/:id')
  approvePackage(@Param('id') id: string) {
    return this.sessionWalletService.approvePackage(id);
  }

  @Post('purchase-bundle')
  purchaseBundle(@Body() body: { userId: string; communityId: string; packageId: string; isPrivate?: boolean; membershipId: string; paymentProofUrl: string }) {
    return this.sessionWalletService.purchaseBundle(body.userId, body.communityId, body.packageId, body.isPrivate, body.membershipId, body.paymentProofUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Post('member/check-in')
  memberCheckIn(@Body() body: { userId: string; communityId: string; packageId?: string; remarks?: string }) {
    return this.sessionWalletService.memberCheckIn(body.userId, body.communityId, body.packageId, body.remarks);
  }

  @UseGuards(JwtAuthGuard)
  @Post('member/check-out')
  memberCheckOut(@Body() body: { userId: string; communityId: string; packageId?: string; remarks?: string }) {
    return this.sessionWalletService.memberCheckOut(body.userId, body.communityId, body.packageId, body.remarks);
  }

  @Post('check-in')
  checkIn(@Body() body: { userId: string; communityId: string; adminId: string; packageId?: string; remarks?: string }) {
    return this.sessionWalletService.checkIn(body.userId, body.communityId, body.adminId, body.packageId, body.remarks);
  }

  @Post('freeze')
  freezeWallet(@Body() body: { walletId: string; days: number; reason: string; adminId: string }) {
    return this.sessionWalletService.freezeWallet(body.walletId, body.days, body.reason, body.adminId);
  }

  @Get('user/:userId')
  getUserWallets(@Param('userId') userId: string, @Query('communityId') communityId: string) {
    return this.sessionWalletService.getUserWallets(userId, communityId);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('admin/community/:communityId/wallets')
  getAdminWallets(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getAdminWallets(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('admin/community/:communityId/attendance')
  getAdminAttendance(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getAdminAttendance(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('admin/community/:communityId/dashboard')
  getAdminDashboardStats(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getAdminDashboardStats(communityId);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('superadmin/wallets')
  getSuperAdminWallets() {
    return this.sessionWalletService.getSuperAdminWallets();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('superadmin/attendance')
  getSuperAdminAttendance() {
    return this.sessionWalletService.getSuperAdminAttendance();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('superadmin/dashboard')

  getSuperAdminDashboardStats() {
    return this.sessionWalletService.getSuperAdminDashboardStats();
  }
}
