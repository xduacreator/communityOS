import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { GuestRegistrationService } from './guest-registration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { RequireTenantRole } from '../auth/decorators/roles.decorator';

@Controller('guest-registrations')
export class GuestRegistrationController {
  constructor(private readonly service: GuestRegistrationService) {}

  @Post('submit')
  submitRegistration(@Body() data: {
    communityId: string;
    packageId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  }) {
    return this.service.submitRegistration(data);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('community/:communityId')
  getRegistrations(@Param('communityId') communityId: string) {
    return this.service.getRegistrationsByCommunity(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: { status: string, communityId: string }) {
    return this.service.updateStatus(id, data.status);
  }
}
