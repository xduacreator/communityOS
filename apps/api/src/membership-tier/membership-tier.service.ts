import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipTierService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.membership.create({ data });
  }

  async findAll(communityId: string) {
    return this.prisma.membership.findMany({ where: { communityId } });
  }

  async update(id: string, data: any) {
    const safeData = { ...data };
    delete safeData.communityId;
    delete safeData.community;
    return this.prisma.membership.update({ where: { id }, data: safeData });
  }

  async remove(id: string) {
    return this.prisma.membership.delete({ where: { id } });
  }
}
