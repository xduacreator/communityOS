import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  TENANT_RESOURCE_KEY,
  TENANT_ROLE_KEY,
  TenantResourceMetadata,
} from '../decorators/roles.decorator';
import { TenantRoleGuard } from './tenant-role.guard';

describe('TenantRoleGuard', () => {
  const createContext = (requestOverrides: Record<string, unknown> = {}): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { userId: 'user-1', isSuperAdmin: false },
        params: { communityId: 'community-1' },
        body: {},
        query: {},
        ...requestOverrides,
      }),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext);

  const createReflector = (
    roles: string[] = ['COMMUNITY_ADMIN', 'COACH'],
    resource?: TenantResourceMetadata,
  ) => ({
    getAllAndOverride: jest.fn((key: string) => {
      if (key === TENANT_ROLE_KEY) return roles;
      if (key === TENANT_RESOURCE_KEY) return resource;
      return undefined;
    }),
  } as unknown as Reflector);

  it('allows a coach when an operational endpoint accepts coach or admin', async () => {
    const prisma = {
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'COACH', status: 'APPROVED' }),
      },
    };
    const guard = new TenantRoleGuard(createReflector(), prisma as never);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('rejects a regular member from operational endpoints', async () => {
    const prisma = {
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'MEMBER', status: 'APPROVED' }),
      },
    };
    const guard = new TenantRoleGuard(createReflector(), prisma as never);

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a coach whose community membership is still pending', async () => {
    const prisma = {
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'COACH', status: 'PENDING' }),
      },
    };
    const guard = new TenantRoleGuard(createReflector(), prisma as never);

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails closed when an endpoint has no community context', async () => {
    const prisma = { communityMember: { findUnique: jest.fn() } };
    const guard = new TenantRoleGuard(createReflector(), prisma as never);
    const context = createContext({ params: {}, body: {}, query: {} });

    await expect(guard.canActivate(context)).rejects.toThrow('Community context is required');
    expect(prisma.communityMember.findUnique).not.toHaveBeenCalled();
  });

  it('authorizes against the community that owns a resource', async () => {
    const prisma = {
      sessionWallet: {
        findUnique: jest.fn().mockResolvedValue({ communityId: 'community-1' }),
      },
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'COMMUNITY_ADMIN', status: 'APPROVED' }),
      },
    };
    const guard = new TenantRoleGuard(
      createReflector(['COMMUNITY_ADMIN'], { resource: 'sessionWallet', source: 'params', key: 'id' }),
      prisma as never,
    );
    const context = createContext({ params: { id: 'wallet-1' } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.communityMember.findUnique).toHaveBeenCalledWith({
      where: { userId_communityId: { userId: 'user-1', communityId: 'community-1' } },
    });
  });

  it('rejects a supplied community that differs from resource ownership', async () => {
    const prisma = {
      sessionWallet: {
        findUnique: jest.fn().mockResolvedValue({ communityId: 'community-2' }),
      },
      communityMember: { findUnique: jest.fn() },
    };
    const guard = new TenantRoleGuard(
      createReflector(['COMMUNITY_ADMIN'], { resource: 'sessionWallet', source: 'params', key: 'id' }),
      prisma as never,
    );
    const context = createContext({
      params: { id: 'wallet-1' },
      body: { communityId: 'community-1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow('Resource does not belong to this community');
    expect(prisma.communityMember.findUnique).not.toHaveBeenCalled();
  });
});
