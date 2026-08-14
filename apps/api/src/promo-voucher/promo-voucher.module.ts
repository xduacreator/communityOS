import { Module } from '@nestjs/common';
import { PromoVoucherService } from './promo-voucher.service';
import { PromoVoucherController } from './promo-voucher.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromoVoucherController],
  providers: [PromoVoucherService],
  exports: [PromoVoucherService],
})
export class PromoVoucherModule {}
