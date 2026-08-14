import { Controller, Get, Param, Patch, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequireSuperAdmin, RequireTenantRole } from '../auth/decorators/roles.decorator';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('public/showcase')
  findPublicShowcase() {
    return this.communityService.findPublicShowcase();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.communityService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Post()
  create(@Body() data: any, @Request() req: any) {
    return this.communityService.create(data, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get()
  findAll() {
    return this.communityService.findAll();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.communityService.suspend(id);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.communityService.activate(id);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Patch(':communityId')
  update(@Param('communityId') id: string, @Body() data: any) {
    return this.communityService.update(id, data);
  }
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Post(':id/reset-data')
  resetData(@Param('id') id: string, @Body() body: { options: string[] }) {
    if (!body.options || !Array.isArray(body.options)) {
      return { success: false, message: 'Invalid options array' };
    }
    return this.communityService.resetData(id, body.options);
  }
}
