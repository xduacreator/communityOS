import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PromoVoucherService, CreateVoucherDto, UpdateVoucherDto } from './promo-voucher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/guards/tenant-role.guard';
import { RequireTenantRole } from '../auth/decorators/roles.decorator';

@Controller('promo-vouchers')
export class PromoVoucherController {
  constructor(private readonly promoVoucherService: PromoVoucherService) {}

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @RequireTenantRole('COMMUNITY_ADMIN')
  @Post()
  create(@Body() dto: CreateVoucherDto) {
    return this.promoVoucherService.create(dto);
  }

  @Get('community/:communityId')
  findByCommunity(@Param('communityId') communityId: string) {
    return this.promoVoucherService.findByCommunity(communityId);
  }

  @Post('validate')
  validateVoucher(@Body() body: { communityId: string; code: string; purchaseAmount: number }) {
    return this.promoVoucherService.validateVoucher(body.communityId, body.code, body.purchaseAmount);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promoVoucherService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.promoVoucherService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoVoucherService.remove(id);
  }
}
