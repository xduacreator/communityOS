import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async readiness() {
    try {
      // A bounded database transaction checks connectivity without exposing data.
      await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1`;
      }, { maxWait: 2000, timeout: 2000 });
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Service unavailable');
    }
  }
}
