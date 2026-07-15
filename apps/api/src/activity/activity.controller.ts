import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  createActivity(@Body() createData: any) {
    return this.activityService.createActivity(createData);
  }

  @Get()
  findAllActivities(@Query('communityId') communityId: string) {
    return this.activityService.findAllActivities(communityId);
  }

  @Post('category')
  createCategory(@Body() createData: any) {
    return this.activityService.createCategory(createData);
  }
}
