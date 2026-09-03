import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  PromoVoucherService,
  CreateVoucherDto,
  UpdateVoucherDto,
  ValidateVoucherDto,
} from './promo-voucher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import {
  RequireTenantResource,
  RequireTenantRole,
} from '../auth/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('promo-vouchers')
export class PromoVoucherController {
  constructor(private readonly promoVoucherService: PromoVoucherService) {}

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Post()
  create(@Body() dto: CreateVoucherDto) {
    return this.promoVoucherService.create(dto);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Get('community/:communityId')
  findByCommunity(@Param('communityId') communityId: string) {
    return this.promoVoucherService.findByCommunity(communityId);
  }

  @Post('validate')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  validateVoucher(@Body() body: ValidateVoucherDto) {
    return this.promoVoucherService.validateVoucher(
      body.communityId,
      body.code,
      body.purchaseAmount,
    );
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('promoVoucher')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promoVoucherService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('promoVoucher')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.promoVoucherService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @RequireTenantResource('promoVoucher')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoVoucherService.remove(id);
  }
}
