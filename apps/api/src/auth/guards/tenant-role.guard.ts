import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  TENANT_RESOURCE_KEY,
  TENANT_ROLE_KEY,
  TenantResourceMetadata,
} from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  private async resolveResourceCommunityId(metadata: TenantResourceMetadata, request: any) {
    const resourceId = request[metadata.source]?.[metadata.key];
    if (!resourceId) return null;

    const directResourceNames = new Set([
      'activity',
      'communityMember',
      'event',
      'galleryImage',
      'guestRegistration',
      'membership',
      'promoVoucher',
      'sessionWallet',
      'userMembership',
    ]);
    if (directResourceNames.has(metadata.resource)) {
      const record = await (this.prisma as any)[metadata.resource].findUnique({
        where: { id: resourceId },
        select: { communityId: true },
      });
      return record?.communityId ?? null;
    }

    if (metadata.resource === 'category') {
      const record = await this.prisma.category.findUnique({
        where: { id: resourceId },
        select: { activity: { select: { communityId: true } } },
      });
      return record?.activity.communityId ?? null;
    }

    const record = await this.prisma.sessionPackage.findUnique({
      where: { id: resourceId },
      select: {
        category: {
          select: { activity: { select: { communityId: true } } },
        },
      },
    });
    return record?.category.activity.communityId ?? null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roleMetadata = this.reflector.getAllAndOverride<string | string[]>(TENANT_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roleMetadata) {
      return true;
    }
    const requiredRoles = Array.isArray(roleMetadata) ? roleMetadata : [roleMetadata];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) { return false; }
    if (user.isSuperAdmin) {
      return true; // Super admins can do anything
    }

    const resourceMetadata = this.reflector.getAllAndOverride<TenantResourceMetadata>(TENANT_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const suppliedCommunityId = request.params?.communityId ?? request.body?.communityId ?? request.query?.communityId;
    const resourceCommunityId = resourceMetadata
      ? await this.resolveResourceCommunityId(resourceMetadata, request)
      : null;

    if (resourceMetadata && !resourceCommunityId) {
      throw new ForbiddenException('Tenant resource could not be resolved');
    }
    if (suppliedCommunityId && resourceCommunityId && suppliedCommunityId !== resourceCommunityId) {
      throw new ForbiddenException('Resource does not belong to this community');
    }

    const communityId = resourceCommunityId ?? suppliedCommunityId;
    if (!communityId) {
      throw new ForbiddenException('Community context is required');
    }

    const membership = await this.prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.userId,
          communityId: communityId,
        },
      },
    });

    if (!membership || membership.status !== 'APPROVED' || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(`Requires tenant role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
