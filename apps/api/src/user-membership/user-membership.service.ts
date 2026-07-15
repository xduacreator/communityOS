import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserMembershipService {
  constructor(private prisma: PrismaService) {}

  async create(data: { userId: string; communityId: string; membershipId: string; startDate?: Date; endDate?: Date; status?: string; paymentProofUrl?: string }) {
    const start = data.startDate || new Date();
    let end = data.endDate;
    
    if (!end) {
      const tier = await this.prisma.membership.findUnique({ where: { id: data.membershipId } });
      if (!tier) throw new Error('Membership tier not found');
      end = new Date(start);
      end.setDate(end.getDate() + tier.durationDays);
    }

    return this.prisma.userMembership.create({
      data: {
        userId: data.userId,
        communityId: data.communityId,
        membershipId: data.membershipId,
        startDate: start,
        endDate: end,
        status: data.status || 'ACTIVE',
        paymentProofUrl: data.paymentProofUrl
      },
      include: { membership: true }
    });
  }

  async findActiveByUser(userId: string, communityId: string) {
    return this.prisma.userMembership.findMany({
      where: {
        userId,
        communityId,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      },
      include: { membership: true }
    });
  }

  async findPendingByCommunity(communityId: string) {
    return this.prisma.userMembership.findMany({
      where: {
        communityId,
        status: 'PENDING'
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        membership: true
      }
    });
  }

  async approve(id: string) {
    const pending = await this.prisma.userMembership.findUnique({
      where: { id },
      include: { membership: true }
    });
    if (!pending) throw new Error('Pending membership renewal not found');

    // Find the furthest future active membership's endDate for this user in this community
    const activeMemberships = await this.prisma.userMembership.findMany({
      where: {
        userId: pending.userId,
        communityId: pending.communityId,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      },
      orderBy: { endDate: 'desc' },
      take: 1
    });

    const start = activeMemberships.length > 0 ? new Date(activeMemberships[0].endDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + pending.membership.durationDays);

    const updated = await this.prisma.userMembership.update({
      where: { id },
      data: {
        startDate: start,
        endDate: end,
        status: 'ACTIVE'
      },
      include: { membership: true }
    });

    // Also approve any linked session wallets!
    const linkedWallets = await this.prisma.sessionWallet.findMany({
      where: { userMembershipId: id }
    });
    for (const w of linkedWallets) {
      const pkg = await this.prisma.sessionPackage.findUnique({ where: { id: w.packageId } });
      if (pkg) {
        const walletStart = new Date();
        const walletEnd = new Date(walletStart);
        walletEnd.setDate(walletEnd.getDate() + pkg.validDays);

        await this.prisma.sessionWallet.update({
          where: { id: w.id },
          data: {
            walletStatus: 'ACTIVE',
            startDate: walletStart,
            expiredDate: walletEnd
          }
        });
      }
    }

    return updated;
  }

  async update(id: string, data: any) {
    return this.prisma.userMembership.update({ where: { id }, data });
  }
}
