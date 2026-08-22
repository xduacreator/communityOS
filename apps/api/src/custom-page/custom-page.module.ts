import { Module } from '@nestjs/common';
import { CustomPageService } from './custom-page.service';
import { CustomPageController } from './custom-page.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomPageController],
  providers: [CustomPageService],
  exports: [CustomPageService],
})
export class CustomPageModule {}
