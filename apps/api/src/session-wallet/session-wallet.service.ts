import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionWalletService {
  constructor(private prisma: PrismaService) {}

  async purchasePackage(userId: string, communityId: string, packageId: string, isPrivate: boolean = false, userMembershipId?: string, paymentProofUrl?: string) {
    const pkg = await this.prisma.sessionPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException('Package not found');

    if (pkg.accessRule === 'MEMBER_ONLY') {
      const member = await this.prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId } }
      });
      if (!member || member.status !== 'APPROVED') {
        throw new BadRequestException('Only approved community members can purchase this package.');
      }
    }

    // New logic: All new standalone purchases are pending approval by admin
    let initialStatus = 'PENDING';
    
    // Check quota based on isPrivate
    if (isPrivate) {
      if (pkg.privateQuota !== null) {
        const privateCount = await this.prisma.sessionWallet.count({
          where: { packageId, isPrivate: true, walletStatus: { in: ['PENDING', 'ACTIVE', 'WAITING'] } }
        });
        if (privateCount >= pkg.privateQuota) {
          initialStatus = 'WAITLIST';
        }
      }
    } else {
      if (pkg.quota !== null) {
        const walletCount = await this.prisma.sessionWallet.count({
          where: { packageId, isPrivate: false, walletStatus: { in: ['PENDING', 'ACTIVE', 'WAITING'] } }
        });
        const guestCount = await this.prisma.guestRegistration.count({
          where: { packageId, status: { in: ['PENDING', 'APPROVED'] } }
        });
        if (walletCount + guestCount >= pkg.quota) {
          initialStatus = 'WAITLIST';
        }
      }
    }
    
    return this.prisma.sessionWallet.create({
      data: {
        userId,
        communityId,
        packageId,
        userMembershipId,
        walletStatus: initialStatus,
        totalSession: pkg.totalSession,
        remainingSession: pkg.totalSession,
        purchaseDate: new Date(),
        paymentProofUrl,
        isPrivate,
      }
    });
  }

  async checkIn(userId: string, communityId: string, adminId: string, packageId?: string, remarks?: string) {
    const activeWallet = await this.prisma.sessionWallet.findFirst({
      where: {
        userId,
        communityId,
        ...(packageId ? { packageId } : {}),
        walletStatus: 'ACTIVE',
        remainingSession: { gt: 0 },
        expiredDate: { gt: new Date() }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!activeWallet) {
      throw new BadRequestException('No active session wallet found or wallet expired/empty');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const updatedWallet = await tx.sessionWallet.update({
        where: { id: activeWallet.id },
        data: {
          remainingSession: { decrement: 1 },
          walletStatus: activeWallet.remainingSession - 1 === 0 ? 'COMPLETED' : 'ACTIVE'
        }
      });

      const transaction = await tx.sessionTransaction.create({
        data: {
          walletId: activeWallet.id,
          transactionType: 'ATTENDANCE',
          beforeSession: activeWallet.remainingSession,
          changeSession: -1,
          afterSession: updatedWallet.remainingSession,
          remarks: remarks || 'Manual Check-in',
          createdBy: adminId
        }
      });

      if (updatedWallet.walletStatus === 'COMPLETED') {
        const nextWallet = await tx.sessionWallet.findFirst({
          where: { userId, communityId, walletStatus: 'WAITING' },
          orderBy: { createdAt: 'asc' }
        });

        if (nextWallet) {
          const pkg = await tx.sessionPackage.findUnique({ where: { id: nextWallet.packageId } });
          const startDate = new Date();
          const expiredDate = new Date();
          if (pkg) expiredDate.setDate(expiredDate.getDate() + pkg.validDays);
          
          await tx.sessionWallet.update({
            where: { id: nextWallet.id },
            data: { walletStatus: 'ACTIVE', startDate, expiredDate }
          });
        }
      }

      return { wallet: updatedWallet, transaction };
    });
  }

  async memberCheckIn(userId: string, communityId: string, packageId?: string, remarks?: string) {
    const activeWallet = await this.prisma.sessionWallet.findFirst({
      where: {
        userId,
        communityId,
        ...(packageId ? { packageId } : {}),
        walletStatus: 'ACTIVE',
        remainingSession: { gt: 0 },
        expiredDate: { gt: new Date() }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!activeWallet) {
      throw new BadRequestException('No active session wallet found or wallet expired/empty');
    }

    const latestTx = await this.prisma.sessionTransaction.findFirst({
      where: { walletId: activeWallet.id, transactionType: 'ATTENDANCE' },
      orderBy: { createdAt: 'desc' }
    });

    if (latestTx && latestTx.remarks?.startsWith('Check-in')) {
      throw new BadRequestException('You are already checked in. Please check out first.');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const updatedWallet = await tx.sessionWallet.update({
        where: { id: activeWallet.id },
        data: {
          remainingSession: { decrement: 1 },
          walletStatus: activeWallet.remainingSession - 1 === 0 ? 'COMPLETED' : 'ACTIVE'
        }
      });

      const transaction = await tx.sessionTransaction.create({
        data: {
          walletId: activeWallet.id,
          transactionType: 'ATTENDANCE',
          beforeSession: activeWallet.remainingSession,
          changeSession: -1,
          afterSession: updatedWallet.remainingSession,
          remarks: remarks || 'Check-in',
          createdBy: userId
        }
      });

      if (updatedWallet.walletStatus === 'COMPLETED') {
        const nextWallet = await tx.sessionWallet.findFirst({
          where: { userId, communityId, packageId: updatedWallet.packageId, walletStatus: 'WAITING' },
          orderBy: { createdAt: 'asc' }
        });

        if (nextWallet) {
          const pkg = await tx.sessionPackage.findUnique({ where: { id: nextWallet.packageId } });
          const startDate = new Date();
          const expiredDate = new Date();
          if (pkg) expiredDate.setDate(expiredDate.getDate() + pkg.validDays);
          
          await tx.sessionWallet.update({
            where: { id: nextWallet.id },
            data: { walletStatus: 'ACTIVE', startDate, expiredDate }
          });
        }
      }

      return { wallet: updatedWallet, transaction };
    });
  }

  async memberCheckOut(userId: string, communityId: string, packageId?: string, remarks?: string) {
    const wallet = await this.prisma.sessionWallet.findFirst({
      where: {
        userId,
        communityId,
        ...(packageId ? { packageId } : {}),
        walletStatus: { in: ['ACTIVE', 'COMPLETED'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!wallet) {
      throw new BadRequestException('No session wallet found');
    }

    const latestTx = await this.prisma.sessionTransaction.findFirst({
      where: { walletId: wallet.id, transactionType: 'ATTENDANCE' },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestTx || !latestTx.remarks?.startsWith('Check-in')) {
      throw new BadRequestException('You are not currently checked in.');
    }

    const transaction = await this.prisma.sessionTransaction.create({
      data: {
        walletId: wallet.id,
        transactionType: 'ATTENDANCE',
        beforeSession: wallet.remainingSession,
        changeSession: 0,
        afterSession: wallet.remainingSession,
        remarks: remarks || 'Check-out',
        createdBy: userId
      }
    });

    return { wallet, transaction };
  }

  async freezeWallet(walletId: string, days: number, reason: string, adminId: string) {
    const wallet = await this.prisma.sessionWallet.findUnique({ where: { id: walletId } });
    if (!wallet || wallet.walletStatus !== 'ACTIVE' || !wallet.expiredDate) {
      throw new BadRequestException('Wallet is not active, has no expiration, or does not exist');
    }

    const newExpiredDate = new Date(wallet.expiredDate);
    newExpiredDate.setDate(newExpiredDate.getDate() + days);

    return this.prisma.$transaction(async (tx: any) => {
      const updatedWallet = await tx.sessionWallet.update({
        where: { id: walletId },
        data: {
          walletStatus: 'FROZEN',
          expiredDate: newExpiredDate,
        }
      });

      const transaction = await tx.sessionTransaction.create({
        data: {
          walletId,
          transactionType: 'FREEZE',
          beforeSession: wallet.remainingSession,
          changeSession: 0,
          afterSession: wallet.remainingSession,
          remarks: `Frozen for ${days} days: ${reason}`,
          createdBy: adminId
        }
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async getUserWallets(userId: string, communityId: string) {
    return this.prisma.sessionWallet.findMany({
      where: { userId, communityId },
      orderBy: { createdAt: 'desc' },
      include: { package: true, transactions: true }
    });
  }

  async getAdminWallets(communityId: string) {
    return this.prisma.sessionWallet.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { select: { id: true, name: true, email: true } }, 
        package: true 
      }
    });
  }

  async getAdminAttendance(communityId: string) {
    return this.prisma.sessionTransaction.findMany({
      where: { 
        wallet: { communityId },
        transactionType: 'ATTENDANCE'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            package: true
          }
        }
      }
    });
  }

  async getAdminDashboardStats(communityId: string) {
    const totalMembers = await this.prisma.communityMember.count({
      where: { communityId, status: 'APPROVED' }
    });

    const activeWallets = await this.prisma.sessionWallet.findMany({
      where: { communityId, remainingSession: { gt: 0 }, walletStatus: 'ACTIVE' },
      include: { 
        user: { select: { id: true, name: true, email: true } }, 
        package: true 
      }
    });

    // Unique buyers
    const buyerIds = new Set(activeWallets.map((w: any) => w.userId));
    const totalPackageBuyers = buyerIds.size;

    // Packages bought distribution
    const packageStats: any = {};
    for (const w of activeWallets) {
      if (!packageStats[w.packageId]) {
        packageStats[w.packageId] = { name: w.package.name, count: 0 };
      }
      packageStats[w.packageId].count += 1;
    }
    const packagesBought = Object.values(packageStats);

    // Expiring soon (e.g., within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringSoon = activeWallets
      .filter((w: any) => w.expiredDate && new Date(w.expiredDate) <= thirtyDaysFromNow)
      .sort((a: any, b: any) => new Date(a.expiredDate!).getTime() - new Date(b.expiredDate!).getTime());

    // Calculate revenues
    const approvedMemberships = await this.prisma.userMembership.findMany({
      where: { communityId, status: { in: ['ACTIVE', 'EXPIRED'] } },
      include: { membership: true }
    });
    const membershipRevenue = approvedMemberships.reduce((sum: number, m: any) => sum + (m.membership?.price || 0), 0);

    const approvedWallets = await this.prisma.sessionWallet.findMany({
      where: { communityId, walletStatus: { in: ['ACTIVE', 'EXPIRED'] } },
      include: { package: true }
    });
    const sessionRevenue = approvedWallets.reduce((sum: number, w: any) => sum + (w.package?.memberPrice || 0), 0);
    const totalRevenue = membershipRevenue + sessionRevenue;

    // Daily check-ins last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const checkins = await this.prisma.sessionTransaction.findMany({
      where: {
        wallet: {
          communityId
        },
        transactionType: 'CHECK_IN',
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const dailyCheckins = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = checkins.filter((c: any) => c.createdAt.toISOString().split('T')[0] === dateStr).length;
      dailyCheckins.push({ date: dateStr, count });
    }

    return {
      totalMembers,
      totalPackageBuyers,
      packagesBought,
      expiringSoon,
      activeWallets,
      membershipRevenue,
      sessionRevenue,
      totalRevenue,
      dailyCheckins
    };
  }

  async getSuperAdminWallets() {
    return this.prisma.sessionWallet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { select: { id: true, name: true, email: true } }, 
        package: true,
        community: { select: { id: true, name: true } }
      }
    });
  }

  async getSuperAdminAttendance() {
    return this.prisma.sessionTransaction.findMany({
      where: { transactionType: 'ATTENDANCE' },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            package: true,
            community: { select: { id: true, name: true } }
          }
        }
      }
    });
  }

  async getSuperAdminDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysCheckins = await this.prisma.sessionTransaction.count({
      where: { 
        transactionType: 'ATTENDANCE',
        createdAt: { gte: today }
      }
    });

    const activeWalletsCount = await this.prisma.sessionWallet.count({
      where: { walletStatus: 'ACTIVE' }
    });

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const packagesSoldMtd = await this.prisma.sessionWallet.count({
      where: { purchaseDate: { gte: firstDayOfMonth } }
    });

    // We can estimate revenue by summing package prices (assuming memberPrice)
    const mtdWallets = await this.prisma.sessionWallet.findMany({
      where: { purchaseDate: { gte: firstDayOfMonth } },
      include: { package: true }
    });
    
    const revenueMtd = mtdWallets.reduce((sum: number, w: any) => sum + (w.package?.memberPrice || 0), 0);

    const expiredFrozenCount = await this.prisma.sessionWallet.count({
      where: { walletStatus: { in: ['EXPIRED', 'FROZEN'] } }
    });

    return {
      todaysCheckins,
      activeWalletsCount,
      packagesSoldMtd,
      revenueMtd,
      expiredFrozenCount
    };
  }

  async purchaseBundle(userId: string, communityId: string, packageId: string, isPrivate: boolean = false, membershipId: string, paymentProofUrl: string) {
    const pkg = await this.prisma.sessionPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException('Package not found');

    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) throw new NotFoundException('Membership tier not found');

    // Create the pending user membership renewal
    const activeMemberships = await this.prisma.userMembership.findMany({
      where: {
        userId,
        communityId,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      },
      orderBy: { endDate: 'desc' },
      take: 1
    });

    const start = activeMemberships.length > 0 ? new Date(activeMemberships[0].endDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + membership.durationDays);

    const userMembership = await this.prisma.userMembership.create({
      data: {
        userId,
        communityId,
        membershipId,
        startDate: start,
        endDate: end,
        status: 'PENDING',
        paymentProofUrl
      }
    });

    // Create the session wallet in WAITING status linked to this pending userMembership
    const sessionWallet = await this.prisma.sessionWallet.create({
      data: {
        userId,
        communityId,
        packageId,
        userMembershipId: userMembership.id,
        walletStatus: 'WAITING',
        totalSession: pkg.totalSession,
        remainingSession: pkg.totalSession,
        purchaseDate: new Date(),
        isPrivate,
      }
    });

    return {
      userMembership,
      sessionWallet
    };
  }

  async findPendingByCommunity(communityId: string) {
    return this.prisma.sessionWallet.findMany({
      where: {
        communityId,
        walletStatus: 'PENDING'
      },
      include: {
        user: true,
        package: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approvePackage(id: string) {
    const pendingWallet = await this.prisma.sessionWallet.findUnique({
      where: { id },
      include: { package: true }
    });

    if (!pendingWallet) {
      throw new NotFoundException('Pending session wallet not found');
    }

    if (
      pendingWallet.walletStatus !== 'PENDING' && 
      pendingWallet.walletStatus !== 'WAITLIST' &&
      pendingWallet.walletStatus !== 'WAITING'
    ) {
      // Jika statusnya sudah ACTIVE, berarti sudah di-approve sebelumnya.
      return pendingWallet;
    }

    // Check if there is an active wallet for the same package
    const activeWallets = await this.prisma.sessionWallet.findMany({
      where: {
        userId: pendingWallet.userId,
        communityId: pendingWallet.communityId,
        packageId: pendingWallet.packageId,
        walletStatus: 'ACTIVE'
      }
    });

    let newStatus = activeWallets.length > 0 ? 'WAITING' : 'ACTIVE';
    
    // Force active jika disetujui manual (bisa disesuaikan tergantung business logic)
    if (pendingWallet.walletStatus === 'WAITING' || pendingWallet.walletStatus === 'WAITLIST') {
      newStatus = 'ACTIVE';
    }

    let startDate = null;
    let expiredDate = null;
    if (newStatus === 'ACTIVE') {
      startDate = new Date();
      expiredDate = new Date();
      if (pendingWallet.package) {
        expiredDate.setDate(expiredDate.getDate() + pendingWallet.package.validDays);
      }
    }

    return this.prisma.sessionWallet.update({
      where: { id },
      data: {
        walletStatus: newStatus,
        ...(newStatus === 'ACTIVE' ? { startDate, expiredDate } : {})
      }
    });
  }
}
