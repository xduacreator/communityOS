import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SessionPackageService } from './session-package.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import {
  RequireSuperAdmin,
  RequireTenantResource,
  RequireTenantRole,
} from '../auth/decorators/roles.decorator';
import {
  CreateSessionPackageDto,
  UpdateSessionPackageDto,
} from './dto/session-package.dto';

@Controller('session-package')
export class SessionPackageController {
  constructor(private readonly sessionPackageService: SessionPackageService) {}

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('category', 'body', 'categoryId')
  @Post()
  create(@Body() createData: CreateSessionPackageDto) {
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

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('sessionPackage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: UpdateSessionPackageDto) {
    return this.sessionPackageService.update(id, updateData);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('superadmin/all')
  findAllSuperAdmin() {
    return this.sessionPackageService.findAllSuperAdmin();
  }
}
