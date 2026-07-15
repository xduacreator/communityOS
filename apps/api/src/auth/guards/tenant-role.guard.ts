import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TENANT_ROLE_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<string>(TENANT_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    const communityId = request.params.communityId || request.body.communityId || request.query.communityId;

    if (!user || !communityId) {
      return false;
    }

    if (user.isSuperAdmin) {
      return true; // Super admins can do anything
    }

    const membership = await this.prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.userId,
          communityId: communityId,
        },
      },
    });

    if (!membership || membership.role !== requiredRole) {
      throw new ForbiddenException(`Requires tenant role: ${requiredRole}`);
    }

    return true;
  }
}
