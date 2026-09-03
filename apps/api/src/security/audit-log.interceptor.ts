import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method || '').toUpperCase();

    if (!MUTATING_METHODS.has(method) || !request.user?.userId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        const routePath = request.route?.path || request.path || 'unknown';
        const originalPath = String(request.originalUrl || routePath).split(
          '?',
        )[0];
        const segments = originalPath.split('/').filter(Boolean);
        const resourceType = segments[0] === 'api' ? segments[1] : segments[0];
        const resourceId =
          result?.id || request.params?.id || request.body?.walletId || null;
        const communityId =
          result?.communityId ||
          request.params?.communityId ||
          request.body?.communityId ||
          null;
        const forwardedFor = request.headers?.['x-forwarded-for'];
        const ipAddress = Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : String(forwardedFor || request.ip || '')
              .split(',')[0]
              .trim();

        void this.prisma.auditLog
          .create({
            data: {
              actorId: request.user.userId,
              actorEmail: request.user.email || null,
              action: `${method} ${routePath}`.slice(0, 250),
              resourceType: String(resourceType || 'unknown').slice(0, 100),
              resourceId: resourceId ? String(resourceId).slice(0, 100) : null,
              communityId: communityId
                ? String(communityId).slice(0, 100)
                : null,
              ipAddress: ipAddress ? ipAddress.slice(0, 100) : null,
              userAgent: request.headers?.['user-agent']?.slice(0, 500) || null,
              metadata: {
                statusCode: context.switchToHttp().getResponse().statusCode,
              },
            },
          })
          .catch((error) => {
            // Audit failures must not roll back an otherwise successful user action.
            console.error('Failed to persist audit log', error);
          });
      }),
    );
  }
}
