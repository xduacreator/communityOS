import { Module } from '@nestjs/common';
import { SessionPackageService } from './session-package.service';
import { SessionPackageController } from './session-package.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SessionPackageController],
  providers: [SessionPackageService],
})
export class SessionPackageModule {}
