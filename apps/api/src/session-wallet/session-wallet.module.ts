import { Module } from '@nestjs/common';
import { SessionWalletController } from './session-wallet.controller';
import { SessionWalletService } from './session-wallet.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SessionWalletController],
  providers: [SessionWalletService]
})
export class SessionWalletModule {}
