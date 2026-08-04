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
        status: { in: ['ACTIVE', 'PENDING'] },
        endDate: { gt: new Date() }
      },
      include: { membership: true },
      orderBy: { endDate: 'desc' }
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
        membership: true,
        sessionWallets: {
          include: {
            package: true
          }
        }
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

    // Ensure the user is an active CommunityMember
    const member = await this.prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: pending.userId,
          communityId: pending.communityId
        }
      }
    });

    if (!member) {
      await this.prisma.communityMember.create({
        data: {
          userId: pending.userId,
          communityId: pending.communityId,
          role: 'MEMBER',
          status: 'APPROVED'
        }
      });
    } else if (member.status === 'PENDING' || member.status === 'REJECTED') {
      await this.prisma.communityMember.update({
        where: { id: member.id },
        data: { status: 'APPROVED' }
      });
    }

    // Reject any other pending memberships for this user/community to prevent duplicate sessions
    await this.prisma.userMembership.updateMany({
      where: {
        userId: pending.userId,
        communityId: pending.communityId,
        status: 'PENDING',
        id: { not: id },
      },
      data: { status: 'REJECTED' },
    });
    return updated;
  }

  async update(id: string, data: any) {
    return this.prisma.userMembership.update({ where: { id }, data });
  }
}
