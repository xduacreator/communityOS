import { BadRequestException } from '@nestjs/common';
import { GuestRegistrationService } from './guest-registration.service';

describe('GuestRegistrationService multi-pax', () => {
  const publicPackage = {
    id: 'package-1',
    accessRule: 'PUBLIC',
    quota: null as number | null,
    category: { activity: { communityId: 'community-1' } },
  };

  const createPrismaMock = () => ({
    sessionPackage: { findUnique: jest.fn().mockResolvedValue(publicPackage) },
    sessionWallet: { count: jest.fn().mockResolvedValue(0) },
    guestRegistration: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(({ data }) => data),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  });

  const submit = (service: GuestRegistrationService, participantNames?: string[]) =>
    service.submitRegistration({
      communityId: 'community-1',
      packageId: 'package-1',
      name: 'Budi',
      email: 'budi@example.com',
      phone: '08123456789',
      address: 'Bandung',
      participantNames,
    });

  it('creates one registration per pax sharing contact details and createdAt', async () => {
    const prisma = createPrismaMock();
    const service = new GuestRegistrationService(prisma as never);

    const result = await submit(service, [' Sari ', 'Andi']);

    const created = prisma.guestRegistration.create.mock.calls.map(([arg]) => arg.data);
    expect(created.map((r) => r.name)).toEqual(['Budi', 'Sari', 'Andi']);
    expect(created.every((r) => r.email === 'budi@example.com' && r.status === 'PENDING')).toBe(true);
    expect(new Set(created.map((r) => r.createdAt.getTime())).size).toBe(1);
    expect(result.paxCount).toBe(3);
  });

  it('keeps single registrations unchanged', async () => {
    const prisma = createPrismaMock();
    const service = new GuestRegistrationService(prisma as never);

    const result = await submit(service);

    expect(prisma.guestRegistration.create).toHaveBeenCalledTimes(1);
    expect(result.paxCount).toBe(1);
  });

  it('waitlists the whole group when there are fewer seats than pax', async () => {
    const prisma = createPrismaMock();
    prisma.sessionPackage.findUnique.mockResolvedValue({ ...publicPackage, quota: 10 });
    prisma.guestRegistration.count.mockResolvedValue(9);
    const service = new GuestRegistrationService(prisma as never);

    await submit(service, ['Sari']);

    const created = prisma.guestRegistration.create.mock.calls.map(([arg]) => arg.data);
    expect(created.map((r) => r.status)).toEqual(['WAITLIST', 'WAITLIST']);
  });

  it('rejects blank names and more than five extra pax', async () => {
    const prisma = createPrismaMock();
    const service = new GuestRegistrationService(prisma as never);

    await expect(submit(service, ['Sari', '  '])).rejects.toBeInstanceOf(BadRequestException);
    await expect(submit(service, ['a', 'b', 'c', 'd', 'e', 'f'])).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.guestRegistration.create).not.toHaveBeenCalled();
  });
});
