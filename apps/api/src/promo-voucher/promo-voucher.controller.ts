import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PromoVoucherService, CreateVoucherDto, UpdateVoucherDto } from './promo-voucher.service';

@Controller('promo-vouchers')
export class PromoVoucherController {
  constructor(private readonly promoVoucherService: PromoVoucherService) {}

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

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.promoVoucherService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoVoucherService.remove(id);
  }
}
