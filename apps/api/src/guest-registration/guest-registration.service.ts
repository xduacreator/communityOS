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

    return this.prisma.guestRegistration.create({
      data: {
        communityId: data.communityId,
        packageId: data.packageId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: 'PENDING'
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
