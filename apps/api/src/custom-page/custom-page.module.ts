import { Module } from '@nestjs/common';
import { CustomPageService } from './custom-page.service';
import { CustomPageController } from './custom-page.controller';

@Module({
  controllers: [CustomPageController],
  providers: [CustomPageService],
  exports: [CustomPageService],
})
export class CustomPageModule {}
