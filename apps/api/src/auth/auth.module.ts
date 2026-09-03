import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { TenantRoleGuard } from './guards/tenant-role.guard';

const insecureJwtSecrets = new Set([
  'super-secret-jwt-key-community-os',
  'super_secret_jwt_key',
]);

// Fail fast instead of starting production with a known or weak signing key.
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || insecureJwtSecrets.has(process.env.JWT_SECRET))
) {
  throw new Error('FATAL: JWT_SECRET must be a unique secret of at least 32 characters in production.');
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
