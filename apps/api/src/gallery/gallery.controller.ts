import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { RequireTenantResource, RequireTenantRole } from '../auth/decorators/roles.decorator';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('community/:communityId')
  findAll(@Param('communityId') communityId: string) {
    return this.galleryService.findAllByCommunity(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Post('community/:communityId')
  create(@Param('communityId') communityId: string, @Body() data: any) {
    return this.galleryService.create(communityId, data);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('galleryImage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
