import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuestRegistrationService {
  constructor(private prisma: PrismaService) {}

  async submitRegistration(data: {
    communityId: string;
    packageId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  }) {
    const pkg = await this.prisma.sessionPackage.findUnique({
      where: { id: data.packageId }
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    
    if (pkg.accessRule !== 'PUBLIC') {
      throw new BadRequestException('This package is not open for public guest registration.');
    }

    let status = 'PENDING';
    if (pkg.quota !== null) {
      const walletCount = await this.prisma.sessionWallet.count({
        where: { packageId: data.packageId, isPrivate: false, walletStatus: { in: ['PENDING', 'ACTIVE', 'WAITING'] } }
      });
      const guestCount = await this.prisma.guestRegistration.count({
        where: { packageId: data.packageId, status: { in: ['PENDING', 'APPROVED'] } }
      });
      if (walletCount + guestCount >= pkg.quota) {
        status = 'WAITLIST';
      }
    }

    return this.prisma.guestRegistration.create({
      data: {
        communityId: data.communityId,
        packageId: data.packageId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: status
      }
    });
  }

  async getRegistrationsByCommunity(communityId: string) {
    return this.prisma.guestRegistration.findMany({
      where: { communityId },
      include: {
        package: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.guestRegistration.update({
      where: { id },
      data: { status }
    });
  }
}
