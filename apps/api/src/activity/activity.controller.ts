import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import {
  RequireTenantResource,
  RequireTenantRole,
} from '../auth/decorators/roles.decorator';
import { CreateActivityDto, CreateCategoryDto } from './dto/activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Post()
  createActivity(@Body() createData: CreateActivityDto) {
    return this.activityService.createActivity(createData);
  }

  @Get()
  findAllActivities(@Query('communityId') communityId: string) {
    return this.activityService.findAllActivities(communityId);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('activity', 'body', 'activityId')
  @Post('category')
  createCategory(@Body() createData: CreateCategoryDto) {
    return this.activityService.createCategory(createData);
  }
}
