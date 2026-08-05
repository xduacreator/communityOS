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
    return this.prisma.sessionPackage.update({ where: { id }, data });
  }

  async findAllSuperAdmin() {
    return this.prisma.sessionPackage.findMany({
      include: { category: { include: { activity: { include: { community: true } } } } }
    });
  }
}
