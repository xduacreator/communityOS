import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async joinCommunity(userId: string, communityId: string, customFieldsData?: string) {
    const existing = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (existing) {
      throw new ConflictException('You have already joined or requested to join this community');
    }
    return this.prisma.communityMember.create({
      data: {
        userId,
        communityId,
        role: 'MEMBER',
        customFieldsData,
      },
    });
  }

  async getMembers(communityId: string) {
    return this.prisma.communityMember.findMany({
      where: { communityId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async getMyStatus(userId: string, slug: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug }
    });
    if (!community) throw new NotFoundException('Community not found');

    const membership = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId: community.id } },
      include: { user: { select: { name: true } } }
    });
    return membership;
  }

  async updateStatus(id: string, status: any, communityId?: string) {
    // Generate membershipNumber on approval if it doesn't exist
    const updateData: any = { status };
    const existing = await this.prisma.communityMember.findUnique({ where: { id } });
    if (!existing || (communityId && existing.communityId !== communityId)) {
      throw new NotFoundException('Member not found in this community');
    }
    if (status === 'APPROVED') {
      if (!existing.membershipNumber) {
        updateData.membershipNumber = 'MEM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      }

        // Auto-approve pending UserMembership if exists (so admin doesn't need to approve twice)
        const pendingUserMembership = await this.prisma.userMembership.findFirst({
          where: { userId: existing.userId, communityId: existing.communityId, status: 'PENDING' },
          include: { membership: true }
        });

        if (pendingUserMembership) {
           const start = new Date();
           const end = new Date(start);
           end.setDate(end.getDate() + pendingUserMembership.membership.durationDays);

           await this.prisma.userMembership.update({
             where: { id: pendingUserMembership.id },
             data: { status: 'ACTIVE', startDate: start, endDate: end }
           });

           // Also approve linked session wallets
           const linkedWallets = await this.prisma.sessionWallet.findMany({
             where: { userMembershipId: pendingUserMembership.id }
           });
           for (const w of linkedWallets) {
             const pkg = await this.prisma.sessionPackage.findUnique({ where: { id: w.packageId } });
             if (pkg) {
                const walletStart = new Date();
                const walletEnd = new Date(walletStart);
                walletEnd.setDate(walletEnd.getDate() + pkg.validDays);
                await this.prisma.sessionWallet.update({
                  where: { id: w.id },
                  data: { walletStatus: 'ACTIVE', startDate: walletStart, expiredDate: walletEnd }
                });
             }
           }
        }
    }
    return this.prisma.communityMember.update({
      where: { id },
      data: updateData
    });
  }

  async updateMember(id: string, data: any, communityId?: string) {
    const { name, email, customFieldsData, ...restData } = data;
    const allowedRoles = ['MEMBER', 'COACH', 'COMMUNITY_ADMIN'];
    if (restData.role !== undefined && !allowedRoles.includes(restData.role)) {
      throw new BadRequestException('Invalid community role');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const member = await tx.communityMember.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!member) {
        throw new NotFoundException('Member not found');
      }
      if (communityId && member.communityId !== communityId) {
        throw new NotFoundException('Member not found in this community');
      }

      if (name !== undefined || email !== undefined) {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            ...(name !== undefined && { name }),
            ...(email !== undefined && { email })
          }
        });
      }

      return tx.communityMember.update({
        where: { id },
        data: {
          ...restData,
          ...(customFieldsData !== undefined && { customFieldsData })
        }
      });
    });
  }

  async deleteMember(id: string, communityId?: string) {
    const member = await this.prisma.communityMember.findUnique({ where: { id } });
    if (!member || (communityId && member.communityId !== communityId)) {
      throw new NotFoundException('Member not found in this community');
    }
    return this.prisma.communityMember.delete({
      where: { id }
    });
  }

  async getAllMembers() {
    return this.prisma.communityMember.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        community: { select: { id: true, name: true, slug: true } }
      }
    });
  }
}
