import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionPackageService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.sessionPackage.create({ data });
  }

  async findAllByCategory(categoryId: string) {
    return this.prisma.sessionPackage.findMany({ where: { categoryId } });
  }

  async findAllByCommunity(communityId: string) {
    return this.prisma.sessionPackage.findMany({
      where: { category: { activity: { communityId } } },
      include: { category: { include: { activity: true } } }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.sessionPackage.update({ where: { id }, data });
  }

  async findAllSuperAdmin() {
    return this.prisma.sessionPackage.findMany({
      include: { category: { include: { activity: { include: { community: true } } } } }
    });
  }
}
