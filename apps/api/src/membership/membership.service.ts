import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
      where: { userId_communityId: { userId, communityId: community.id } }
    });
    return membership;
  }

  async updateStatus(id: string, status: any) {
    // Generate membershipNumber on approval if it doesn't exist
    const updateData: any = { status };
    if (status === 'APPROVED') {
      const existing = await this.prisma.communityMember.findUnique({ where: { id } });
      if (existing && !existing.membershipNumber) {
        updateData.membershipNumber = 'MEM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      }
    }
    return this.prisma.communityMember.update({
      where: { id },
      data: updateData
    });
  }

  async updateMember(id: string, data: any) {
    const { name, email, customFieldsData, ...restData } = data;
    
    return this.prisma.$transaction(async (tx: any) => {
      const member = await tx.communityMember.findUnique({
        where: { id },
        include: { user: true }
      });
      
      if (!member) {
        throw new NotFoundException('Member not found');
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

  async deleteMember(id: string) {
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
