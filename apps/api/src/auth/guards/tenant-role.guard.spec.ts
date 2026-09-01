import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantRoleGuard } from './tenant-role.guard';

describe('TenantRoleGuard', () => {
  const createContext = (): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { userId: 'user-1', isSuperAdmin: false },
        params: { communityId: 'community-1' },
        body: {},
        query: {},
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

  it('allows a coach when an operational endpoint accepts coach or admin', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['COMMUNITY_ADMIN', 'COACH']),
    } as unknown as Reflector;
    const prisma = {
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'COACH', status: 'APPROVED' }),
      },
    };
    const guard = new TenantRoleGuard(reflector, prisma as never);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('rejects a regular member from operational endpoints', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['COMMUNITY_ADMIN', 'COACH']),
    } as unknown as Reflector;
    const prisma = {
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'MEMBER', status: 'APPROVED' }),
      },
    };
    const guard = new TenantRoleGuard(reflector, prisma as never);

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a coach whose community membership is still pending', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['COMMUNITY_ADMIN', 'COACH']),
    } as unknown as Reflector;
    const prisma = {
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'COACH', status: 'PENDING' }),
      },
    };
    const guard = new TenantRoleGuard(reflector, prisma as never);

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
