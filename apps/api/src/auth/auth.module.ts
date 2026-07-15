import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { TenantRoleGuard } from './guards/tenant-role.guard';

// Assert secure JWT configuration in production environments
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super-secret-jwt-key-community-os')) {
  throw new Error('FATAL: A secure JWT_SECRET environment variable must be specified in production mode!');
}

const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-community-os';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, TenantRoleGuard],
  controllers: [AuthController],
  exports: [TenantRoleGuard],
})
export class AuthModule {}
