import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommunityModule } from './community/community.module';
import { MembershipModule } from './membership/membership.module';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { GalleryModule } from './gallery/gallery.module';
import { ActivityModule } from './activity/activity.module';
import { SessionPackageModule } from './session-package/session-package.module';
import { SessionWalletModule } from './session-wallet/session-wallet.module';
import { UserMembershipModule } from './user-membership/user-membership.module';
import { MembershipTierModule } from './membership-tier/membership-tier.module';
import { CronModule } from './cron/cron.module';
import { SystemSettingModule } from './system-setting/system-setting.module';
import { GuestRegistrationModule } from './guest-registration/guest-registration.module';
import { PromoVoucherModule } from './promo-voucher/promo-voucher.module';

import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LandingPageModule } from './landing-page/landing-page.module';
import { BlogPostModule } from './blog-post/blog-post.module';
import { CustomPageModule } from './custom-page/custom-page.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/api',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // Maximum 100 requests per minute per IP
    }]),
    AuthModule, 
    PrismaModule, 
    CommunityModule, 
    MembershipModule, 
    UserModule, 
    EventModule, 
    GalleryModule, ActivityModule, SessionPackageModule, SessionWalletModule, UserMembershipModule, MembershipTierModule, CronModule,
    SystemSettingModule,
    GuestRegistrationModule,
    PromoVoucherModule,
    LandingPageModule,
    BlogPostModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
