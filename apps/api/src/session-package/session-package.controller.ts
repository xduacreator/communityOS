import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { SessionPackageService } from './session-package.service';

@Controller('session-package')
export class SessionPackageController {
  constructor(private readonly sessionPackageService: SessionPackageService) {}

  @Post()
  create(@Body() createData: any) {
    return this.sessionPackageService.create(createData);
  }

  @Get('category/:categoryId')
  findAllByCategory(@Param('categoryId') categoryId: string) {
    return this.sessionPackageService.findAllByCategory(categoryId);
  }

  @Get('community/:communityId')
  findAllByCommunity(@Param('communityId') communityId: string) {
    return this.sessionPackageService.findAllByCommunity(communityId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.sessionPackageService.update(id, updateData);
  }

  @Get('superadmin/all')
  findAllSuperAdmin() {
    return this.sessionPackageService.findAllSuperAdmin();
  }
}
