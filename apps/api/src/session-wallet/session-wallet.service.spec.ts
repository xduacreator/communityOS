import { BadRequestException } from '@nestjs/common';
import { SessionWalletService } from './session-wallet.service';

describe('SessionWalletService voucher pricing', () => {
  const createPrismaMock = () => ({
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
