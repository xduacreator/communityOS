import { Module } from '@nestjs/common';
import { SessionExpirationService } from './session-expiration/session-expiration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SessionExpirationService],
})
export class CronModule {}
