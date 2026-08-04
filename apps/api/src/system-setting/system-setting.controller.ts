import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { SystemSettingService, UpdateSettingsDto } from './system-setting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@Controller('system-settings')
export class SystemSettingController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  @Get()
  async getAllSettings() {
    return this.systemSettingService.getAllSettings();
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.systemSettingService.getSetting(key);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Put()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.systemSettingService.updateSettings(dto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Put('reset-transactions')
  async resetTransactions() {
    return this.systemSettingService.resetTransactions();
  }
}
