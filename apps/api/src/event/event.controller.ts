import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { RequireTenantRole } from '../auth/decorators/roles.decorator';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Post('community/:communityId')
  create(@Param('communityId') communityId: string, @Body() data: any) {
    return this.eventService.create(communityId, data);
  }

  @Get('community/:communityId')
  findAll(@Param('communityId') communityId: string) {
    return this.eventService.findAllByCommunity(communityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @UseGuards(JwtAuthGuard) // Need custom guard if we want to ensure only admin of THIS community can edit
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: any) {
    return this.eventService.update(id, updateEventDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  register(@Param('id') id: string, @Request() req: any) {
    return this.eventService.register(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/attendees')
  getAttendees(@Param('id') id: string) {
    return this.eventService.getAttendees(id);
  }
}
