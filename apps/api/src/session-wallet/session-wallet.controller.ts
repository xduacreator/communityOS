import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SessionWalletService } from './session-wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('session-wallet')
export class SessionWalletController {
  constructor(private readonly sessionWalletService: SessionWalletService) {}

  @Post('purchase')
  purchasePackage(@Body() body: { userId: string; communityId: string; packageId: string; userMembershipId?: string }) {
    return this.sessionWalletService.purchasePackage(body.userId, body.communityId, body.packageId, body.userMembershipId);
  }

  @Post('purchase-bundle')
  purchaseBundle(@Body() body: { userId: string; communityId: string; packageId: string; membershipId: string; paymentProofUrl: string }) {
    return this.sessionWalletService.purchaseBundle(body.userId, body.communityId, body.packageId, body.membershipId, body.paymentProofUrl);
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
  @Get('admin/community/:communityId/wallets')
  getAdminWallets(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getAdminWallets(communityId);
  }

  @Get('admin/community/:communityId/attendance')
  getAdminAttendance(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getAdminAttendance(communityId);
  }

  @Get('admin/community/:communityId/dashboard')
  getAdminDashboardStats(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getAdminDashboardStats(communityId);
  }

  @Get('superadmin/wallets')
  getSuperAdminWallets() {
    return this.sessionWalletService.getSuperAdminWallets();
  }

  @Get('superadmin/attendance')
  getSuperAdminAttendance() {
    return this.sessionWalletService.getSuperAdminAttendance();
  }

  @Get('superadmin/dashboard')
  getSuperAdminDashboardStats() {
    return this.sessionWalletService.getSuperAdminDashboardStats();
  }
}
