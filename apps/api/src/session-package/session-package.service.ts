import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionPackageService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const safeData = this.sanitizeData(data);
    return this.prisma.sessionPackage.create({ data: safeData });
  }

  async findAllByCategory(categoryId: string) {
    return this.prisma.sessionPackage.findMany({ where: { categoryId } });
  }

  async findAllByCommunity(communityId: string) {
    const packages = await this.prisma.sessionPackage.findMany({
      where: { category: { activity: { communityId } } },
      include: {
        category: { include: { activity: true } },
        sessionWallets: {
          where: { walletStatus: { in: ['PENDING', 'ACTIVE', 'WAITING'] } }
        },
        guestRegistrations: {
          where: { status: { in: ['PENDING', 'APPROVED'] } }
        }
      }
    });

    return packages.map(pkg => {
      const currentParticipants = pkg.sessionWallets.filter(w => !w.isPrivate).length + pkg.guestRegistrations.length;
      const currentPrivateParticipants = pkg.sessionWallets.filter(w => w.isPrivate).length;
      const { sessionWallets, guestRegistrations, ...rest } = pkg;
      return { ...rest, currentParticipants, currentPrivateParticipants };
    });
  }

  async update(id: string, data: any) {
    const currentPackage = await this.prisma.sessionPackage.findUnique({
      where: { id },
      include: { category: { include: { activity: true } } },
    });
    if (!currentPackage) throw new NotFoundException('Package not found');

    if (data.categoryId && data.categoryId !== currentPackage.categoryId) {
      const targetCategory = await this.prisma.category.findUnique({
        where: { id: data.categoryId },
        include: { activity: true },
      });
      if (!targetCategory || targetCategory.activity.communityId !== currentPackage.category.activity.communityId) {
        throw new BadRequestException('Package cannot be moved to another community');
      }
    }

    return this.prisma.sessionPackage.update({ where: { id }, data: this.sanitizeData(data) });
  }

  async findAllSuperAdmin() {
    return this.prisma.sessionPackage.findMany({
      include: { category: { include: { activity: { include: { community: true } } } } }
    });
  }

  private sanitizeData(data: any) {
    const safeData = { ...data };
    for (const key of ['id', 'category', 'sessionWallets', 'guestRegistrations', 'createdAt', 'updatedAt']) {
      delete safeData[key];
    }
    return safeData;
  }
}
