import { Module } from '@nestjs/common';
import { MembershipTierService } from './membership-tier.service';
import { MembershipTierController } from './membership-tier.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipTierController],
  providers: [MembershipTierService],
})
export class MembershipTierModule {}
