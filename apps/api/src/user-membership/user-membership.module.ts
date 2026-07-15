import { Module } from '@nestjs/common';
import { UserMembershipService } from './user-membership.service';
import { UserMembershipController } from './user-membership.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserMembershipController],
  providers: [UserMembershipService],
})
export class UserMembershipModule {}
