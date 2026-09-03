import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { SystemSettingService, UpdateSettingsDto } from './system-setting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequireSuperAdmin } from '../auth/decorators/roles.decorator';

@Controller('system-settings')
export class SystemSettingController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  @Get()
  async getAllSettings() {
    return this.systemSettingService.getPublicSettings();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('admin/all')
  async getAllSettingsForAdmin() {
    return this.systemSettingService.getAllSettings();
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.systemSettingService.getPublicSetting(key);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Put()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.systemSettingService.updateSettings(dto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Put('reset-transactions')
  async resetTransactions() {
    return this.systemSettingService.resetTransactions();
  }
}
