import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SettingItemDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class UpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings: SettingItemDto[];
}

@Injectable()
export class SystemSettingService {
  constructor(private prisma: PrismaService) {}

  private isPublicKey(key: string) {
    return ['landing.', 'platform.', 'seo.'].some((prefix) => key.startsWith(prefix));
  }

  async getPublicSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    return Object.fromEntries(
      settings
        .filter((setting) => this.isPublicKey(setting.key))
        .map((setting) => [setting.key, setting.value]),
    );
  }

  async getPublicSetting(key: string) {
    if (!this.isPublicKey(key)) {
      throw new NotFoundException('Setting not found');
    }
    return this.getSetting(key);
  }

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    // Convert to a simple key-value object
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }
    return settingsMap;
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const results = [];
    
    // We use a transaction or sequential updates to upsert all settings
    for (const item of dto.settings) {
      const updated = await this.prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      });
      results.push(updated);
    }
    
    return results;
  }

  async resetTransactions() {
    // Run inside a transaction for safety
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all Guest Registrations
      const guestRes = await tx.guestRegistration.deleteMany({});
      
      // 2. Delete all Session Transactions (history)
      const txRes = await tx.sessionTransaction.deleteMany({});
      
      // 3. Delete all Session Wallets (member purchases/quotas)
      const walletRes = await tx.sessionWallet.deleteMany({});
      
      return {
        success: true,
        message: 'All transactional data reset successfully',
        details: {
          guestsDeleted: guestRes.count,
          historyDeleted: txRes.count,
          walletsDeleted: walletRes.count
        }
      };
    });
  }
}
