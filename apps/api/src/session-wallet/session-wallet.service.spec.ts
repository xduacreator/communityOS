import { BadRequestException } from '@nestjs/common';
import { SessionWalletService } from './session-wallet.service';

// Runs $transaction callbacks against the same mock client.
const withTransaction = <T extends object>(prisma: T) =>
  Object.assign(prisma, {
    $transaction: jest.fn((callback: (tx: T) => unknown) => callback(prisma)),
  });

const publicPackage = {
  id: 'package-1',
  accessRule: 'PUBLIC',
  memberPrice: 100_000,
  vipPrice: null,
  totalSession: 8,
  validDays: 30,
  quota: null as number | null,
  privateQuota: null,
  category: { activity: { communityId: 'community-1' } },
};

describe('SessionWalletService voucher pricing', () => {
  const createPrismaMock = () => withTransaction({
    sessionPackage: {
      findUnique: jest.fn(),
    },
    userMembership: {
      findFirst: jest.fn(),
    },
    sessionWallet: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    guestRegistration: {
      count: jest.fn().mockResolvedValue(0),
    },
    promoVoucher: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  });

  it('stores the discounted paid price for an approved voucher', async () => {
    const prisma = createPrismaMock();
    prisma.sessionPackage.findUnique.mockResolvedValue({
      id: 'package-1',
      accessRule: 'PUBLIC',
      memberPrice: 200_000,
      vipPrice: 300_000,
      totalSession: 8,
      validDays: 30,
      quota: null,
      privateQuota: null,
      category: { activity: { communityId: 'community-1' } },
    });
    prisma.promoVoucher.findUnique.mockResolvedValue({
      id: 'voucher-1',
      communityId: 'community-1',
      status: 'ACTIVE',
      validFrom: new Date('2020-01-01'),
      validUntil: null,
      maxUses: null,
      usedCount: 0,
      minPurchase: null,
      discountType: 'PERCENTAGE',
      discountValue: 25,
      maxDiscount: null,
    });
    prisma.promoVoucher.update.mockResolvedValue({});
    prisma.sessionWallet.create.mockImplementation(({ data }) => data);

    const service = new SessionWalletService(prisma as never);
    const result = await service.purchasePackage(
      'user-1',
      'community-1',
      'package-1',
      false,
      undefined,
      '/proof.png',
      'voucher-1',
    );

    expect(result).toEqual(expect.objectContaining({
      walletStatus: 'PENDING',
      paidPrice: 150_000,
      discountAmount: 50_000,
      promoVoucherId: 'voucher-1',
    }));
    expect(prisma.promoVoucher.update).toHaveBeenCalledWith({
      where: { id: 'voucher-1' },
      data: { usedCount: { increment: 1 } },
    });
  });

  it('rejects a voucher belonging to another community', async () => {
    const prisma = createPrismaMock();
    prisma.sessionPackage.findUnique.mockResolvedValue({
      id: 'package-1',
      accessRule: 'PUBLIC',
      memberPrice: 100_000,
      vipPrice: null,
      totalSession: 4,
      validDays: 30,
      quota: null,
      privateQuota: null,
      category: { activity: { communityId: 'community-1' } },
    });
    prisma.promoVoucher.findUnique.mockResolvedValue({
      id: 'voucher-1',
      communityId: 'another-community',
    });

    const service = new SessionWalletService(prisma as never);

    await expect(service.purchasePackage(
      'user-1',
      'community-1',
      'package-1',
      false,
      undefined,
      '/proof.png',
      'voucher-1',
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sessionWallet.create).not.toHaveBeenCalled();
  });
});

describe('SessionWalletService attendance', () => {
  const createPrismaMock = (latestTx: unknown) => ({
    userMembership: { findFirst: jest.fn().mockResolvedValue({ id: 'um-1' }) },
    sessionPackage: { findUnique: jest.fn().mockResolvedValue({ accessRule: 'PUBLIC' }) },
    community: { findUnique: jest.fn().mockResolvedValue({ registrationMode: 'FREE' }) },
    sessionWallet: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'wallet-1',
        packageId: 'package-1',
        remainingSession: 5,
      }),
    },
    sessionTransaction: {
      findFirst: jest.fn().mockResolvedValue(latestTx),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  it('blocks a second admin check-in on the same day regardless of remarks', async () => {
    const prisma = createPrismaMock({ changeSession: -1, remarks: 'Manual Check-in via Admin' });
    const service = new SessionWalletService(prisma as never);

    await expect(
      service.checkIn('user-1', 'community-1', 'admin-1', 'package-1', 'Manual Check-in via Admin'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('checks in a non-membership package without an active membership', async () => {
    const prisma = createPrismaMock(null);
    prisma.userMembership.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockResolvedValue({ wallet: {}, transaction: {} });
    const service = new SessionWalletService(prisma as never);

    await service.checkIn('user-1', 'community-1', 'coach-1', undefined, undefined, 'wallet-1');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.sessionWallet.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'wallet-1' }) }),
    );
  });

  it('still requires an active membership for member-only packages', async () => {
    const prisma = createPrismaMock(null);
    prisma.userMembership.findFirst.mockResolvedValue(null);
    prisma.sessionPackage.findUnique.mockResolvedValue({ accessRule: 'MEMBER_ONLY' });
    const service = new SessionWalletService(prisma as never);

    await expect(
      service.memberCheckIn('user-1', 'community-1', 'package-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    // Without an explicit wallet only the buyer's own wallet is used
    expect(prisma.sessionWallet.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ participantName: null }) }),
    );
  });

  it('lets a member check out after an admin check-in', async () => {
    const prisma = createPrismaMock({ changeSession: -1, remarks: 'Manual Check-in via Admin' });
    prisma.sessionTransaction.create.mockImplementation(({ data }) => data);
    const service = new SessionWalletService(prisma as never);

    const result = await service.memberCheckOut('user-1', 'community-1', 'package-1');
    expect(result.transaction).toEqual(expect.objectContaining({ changeSession: 0 }));
  });

  it('rejects check-out when the last attendance today was already a check-out', async () => {
    const prisma = createPrismaMock({ changeSession: 0, remarks: 'Check-out' });
    const service = new SessionWalletService(prisma as never);

    await expect(
      service.memberCheckOut('user-1', 'community-1', 'package-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SessionWalletService multi-pax orders', () => {
  const createPrismaMock = () => withTransaction({
    sessionPackage: { findUnique: jest.fn() },
    userMembership: { findFirst: jest.fn() },
    sessionWallet: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(({ data }) => ({ id: `wallet-${data.participantName ?? 'buyer'}`, ...data })),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(({ where, data }) => ({ id: where.id, ...data })),
    },
    guestRegistration: { count: jest.fn().mockResolvedValue(0) },
    promoVoucher: { findUnique: jest.fn(), update: jest.fn() },
  });

  const purchase = (service: SessionWalletService, names: string[], voucherId?: string) =>
    service.purchasePackage('user-1', 'community-1', 'package-1', false, undefined, '/proof.png', voucherId, names);

  it('creates one wallet per pax and multiplies the price', async () => {
    const prisma = createPrismaMock();
    prisma.sessionPackage.findUnique.mockResolvedValue(publicPackage);
    const service = new SessionWalletService(prisma as never);

    const result = await purchase(service, [' Budi ', 'Sari']);

    expect(prisma.sessionWallet.create).toHaveBeenCalledTimes(3);
    const created = prisma.sessionWallet.create.mock.calls.map(([arg]) => arg.data);
    expect(created.map((w) => w.participantName)).toEqual([null, 'Budi', 'Sari']);
    expect(created.every((w) => w.totalSession === 8 && w.walletStatus === 'PENDING')).toBe(true);
    expect(new Set(created.map((w) => w.orderGroupId)).size).toBe(1);
    expect(created[0].orderGroupId).toEqual(expect.any(String));
    expect(created.reduce((sum, w) => sum + w.paidPrice, 0)).toBe(300_000);
    expect(result.paxCount).toBe(3);
  });

  it('applies the voucher to the order total and splits it across pax', async () => {
    const prisma = createPrismaMock();
    prisma.sessionPackage.findUnique.mockResolvedValue(publicPackage);
    prisma.promoVoucher.findUnique.mockResolvedValue({
      id: 'voucher-1',
      communityId: 'community-1',
      status: 'ACTIVE',
      validFrom: new Date('2020-01-01'),
      validUntil: null,
      maxUses: null,
      usedCount: 0,
      minPurchase: 250_000,
      discountType: 'FIXED',
      discountValue: 50_000,
      maxDiscount: null,
    });
    const service = new SessionWalletService(prisma as never);

    await purchase(service, ['Budi', 'Sari'], 'voucher-1');

    const created = prisma.sessionWallet.create.mock.calls.map(([arg]) => arg.data);
    expect(created.reduce((sum, w) => sum + w.paidPrice, 0)).toBe(250_000);
    expect(created.reduce((sum, w) => sum + w.discountAmount, 0)).toBe(50_000);
    expect(prisma.promoVoucher.update).toHaveBeenCalledTimes(1);
  });

  it('puts the whole order on the waiting list when there are fewer seats than pax', async () => {
    const prisma = createPrismaMock();
    prisma.sessionPackage.findUnique.mockResolvedValue({ ...publicPackage, quota: 10 });
    prisma.sessionWallet.count.mockResolvedValue(9);
    const service = new SessionWalletService(prisma as never);

    await purchase(service, ['Budi']);

    const created = prisma.sessionWallet.create.mock.calls.map(([arg]) => arg.data);
    expect(created.map((w) => w.walletStatus)).toEqual(['WAITLIST', 'WAITLIST']);
  });

  it('rejects extra pax on membership packages and blank names', async () => {
    const prisma = createPrismaMock();
    prisma.sessionPackage.findUnique.mockResolvedValue({ ...publicPackage, accessRule: 'MEMBER_ONLY' });
    const service = new SessionWalletService(prisma as never);
    await expect(purchase(service, ['Budi'])).rejects.toBeInstanceOf(BadRequestException);

    prisma.sessionPackage.findUnique.mockResolvedValue(publicPackage);
    await expect(purchase(service, ['Budi', '   '])).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sessionWallet.create).not.toHaveBeenCalled();
  });

  it('approves every wallet of a multi-pax order together', async () => {
    const prisma = createPrismaMock();
    const pendingWallet = (id: string, participantName: string | null) => ({
      id,
      orderGroupId: 'order-1',
      walletStatus: 'PENDING',
      userId: 'user-1',
      communityId: 'community-1',
      packageId: 'package-1',
      participantName,
      userMembershipId: null,
      package: { validDays: 30 },
    });
    prisma.sessionWallet.findUnique
      .mockResolvedValueOnce({ id: 'wallet-buyer', orderGroupId: 'order-1' })
      .mockResolvedValueOnce(pendingWallet('wallet-buyer', null))
      .mockResolvedValueOnce(pendingWallet('wallet-Budi', 'Budi'));
    prisma.sessionWallet.findMany
      .mockResolvedValueOnce([{ id: 'wallet-buyer' }, { id: 'wallet-Budi' }])
      .mockResolvedValue([]);
    const service = new SessionWalletService(prisma as never);

    const result = await service.approvePackage('wallet-buyer');

    expect(result).toEqual(expect.objectContaining({ id: 'wallet-buyer', walletStatus: 'ACTIVE' }));
    const activated = prisma.sessionWallet.update.mock.calls.map(([arg]) => arg.where.id);
    expect(activated).toEqual(['wallet-buyer', 'wallet-Budi']);
    // Merging only looks at earlier wallets of the same participant
    expect(prisma.sessionWallet.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ participantName: 'Budi', walletStatus: 'ACTIVE' }),
    });
  });
});
