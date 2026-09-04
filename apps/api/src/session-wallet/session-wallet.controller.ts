import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Request,
} from '@nestjs/common';
import { SessionWalletService } from './session-wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import {
  RequireTenantResource,
  RequireTenantRole,
  RequireTenantRoles,
  RequireSuperAdmin,
} from '../auth/decorators/roles.decorator';
import {
  CoachCheckInDto,
  FreezeWalletDto,
  MemberAttendanceDto,
  PurchaseBundleDto,
  PurchasePackageDto,
} from './dto/session-wallet.dto';

@Controller('session-wallet')
export class SessionWalletController {
  constructor(private readonly sessionWalletService: SessionWalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  purchasePackage(@Request() req: any, @Body() body: PurchasePackageDto) {
    return this.sessionWalletService.purchasePackage(
      req.user.userId,
      body.communityId,
      body.packageId,
      body.isPrivate,
      body.userMembershipId,
      body.paymentProofUrl,
      body.promoVoucherId,
    );
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('pending/:communityId')
  findPendingByCommunity(@Param('communityId') communityId: string) {
    return this.sessionWalletService.findPendingByCommunity(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('sessionWallet')
  @Patch('approve/:id')
  approvePackage(@Param('id') id: string) {
    return this.sessionWalletService.approvePackage(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('purchase-bundle')
  purchaseBundle(@Request() req: any, @Body() body: PurchaseBundleDto) {
    return this.sessionWalletService.purchaseBundle(
      req.user.userId,
      body.communityId,
      body.packageId,
      body.isPrivate,
      body.membershipId,
      body.paymentProofUrl,
      body.promoVoucherId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('member/check-in')
  memberCheckIn(@Request() req: any, @Body() body: MemberAttendanceDto) {
    return this.sessionWalletService.memberCheckIn(
      req.user.userId,
      body.communityId,
      body.packageId,
      body.remarks,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('member/check-out')
  memberCheckOut(@Request() req: any, @Body() body: MemberAttendanceDto) {
    return this.sessionWalletService.memberCheckOut(
      req.user.userId,
      body.communityId,
      body.packageId,
      body.remarks,
    );
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRoles('COMMUNITY_ADMIN', 'COACH')
  @Post('check-in')
  checkIn(@Request() req: any, @Body() body: CoachCheckInDto) {
    return this.sessionWalletService.checkIn(
      body.userId,
      body.communityId,
      req.user.userId,
      body.packageId,
      body.remarks,
    );
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('sessionWallet', 'body', 'walletId')
  @Post('freeze')
  freezeWallet(@Request() req: any, @Body() body: FreezeWalletDto) {
    return this.sessionWalletService.freezeWallet(
      body.walletId,
      body.days,
      body.reason,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  getUserWallets(
    @Request() req: any,
    @Query('communityId') communityId: string,
  ) {
    return this.sessionWalletService.getUserWallets(
      req.user.userId,
      communityId,
    );
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
  @RequireTenantRoles('COMMUNITY_ADMIN', 'COACH')
  @Get('operations/community/:communityId/participants')
  getOperationalParticipants(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getOperationalParticipants(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRoles('COMMUNITY_ADMIN', 'COACH')
  @Get('operations/community/:communityId/attendance')
  getOperationalAttendance(@Param('communityId') communityId: string) {
    return this.sessionWalletService.getOperationalAttendance(communityId);
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
