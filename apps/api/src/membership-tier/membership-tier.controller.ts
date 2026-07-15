import { Controller, Get, Post, Body, Patch, Param, Query, Delete } from '@nestjs/common';
import { MembershipTierService } from './membership-tier.service';

@Controller('membership-tier')
export class MembershipTierController {
  constructor(private readonly membershipTierService: MembershipTierService) {}

  @Post()
  create(@Body() createData: any) {
    return this.membershipTierService.create(createData);
  }

  @Get()
  findAll(@Query('communityId') communityId: string) {
    return this.membershipTierService.findAll(communityId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.membershipTierService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membershipTierService.remove(id);
  }
}
