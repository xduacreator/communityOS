import { Module } from '@nestjs/common';
import { GuestRegistrationController } from './guest-registration.controller';
import { GuestRegistrationService } from './guest-registration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuestRegistrationController],
  providers: [GuestRegistrationService],
})
export class GuestRegistrationModule {}
