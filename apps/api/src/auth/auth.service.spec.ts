import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const jwtService = {
    sign: jest.fn(),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as never, jwtService as never);
  });

  it('returns membership status so the frontend can authorize admin and coach redirects', async () => {
    const profile = {
      id: 'user-1',
      name: 'Admin',
      email: 'admin@example.com',
      isSuperAdmin: false,
      createdAt: new Date(),
      memberships: [{ role: 'COMMUNITY_ADMIN', status: 'APPROVED', community: { slug: 'community' } }],
    };
    prisma.user.findUnique.mockResolvedValue(profile);

    await expect(service.getProfile('user-1')).resolves.toEqual(profile);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        memberships: {
          select: {
            role: true,
            status: true,
            community: { select: { slug: true } },
          },
        },
      }),
    }));
  });

  it('rejects a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('missing-user')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
