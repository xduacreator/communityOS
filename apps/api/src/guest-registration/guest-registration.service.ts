import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MAX_EXTRA_PAX } from '../session-wallet/dto/session-wallet.dto';

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
    participantNames?: string[];
  }) {
    const pkg = await this.prisma.sessionPackage.findUnique({
      where: { id: data.packageId },
      include: { category: { include: { activity: true } } },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    if (pkg.category.activity.communityId !== data.communityId) {
      throw new BadRequestException('Package does not belong to this community');
    }
    
    if (pkg.accessRule !== 'PUBLIC') {
      throw new BadRequestException('This package is not open for public guest registration.');
    }

    const extraPax = (data.participantNames ?? []).map((name) => name.trim());
    if (extraPax.length > MAX_EXTRA_PAX) {
      throw new BadRequestException(`Maksimal ${MAX_EXTRA_PAX} peserta tambahan.`);
    }
    if (extraPax.some((name) => !name)) {
      throw new BadRequestException('Nama setiap peserta tambahan wajib diisi.');
    }
    const paxCount = 1 + extraPax.length;

    // Every pax takes a seat; the whole group waits together when seats run short
    let status = 'PENDING';
    if (pkg.quota !== null) {
      const walletCount = await this.prisma.sessionWallet.count({
        where: { packageId: data.packageId, isPrivate: false, walletStatus: { in: ['PENDING', 'ACTIVE', 'WAITING'] } }
      });
      const guestCount = await this.prisma.guestRegistration.count({
        where: { packageId: data.packageId, status: { in: ['PENDING', 'APPROVED'] } }
      });
      if (walletCount + guestCount + paxCount > pkg.quota) {
        status = 'WAITLIST';
      }
    }

    // One registration per pax; a shared createdAt lets admins see them as one group
    const createdAt = new Date();
    const registrations = await this.prisma.$transaction(
      [data.name, ...extraPax].map((name) =>
        this.prisma.guestRegistration.create({
          data: {
            communityId: data.communityId,
            packageId: data.packageId,
            name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            status,
            createdAt,
          },
        }),
      ),
    );

    return { ...registrations[0], paxCount, registrations };
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
    if (!['PENDING', 'APPROVED', 'REJECTED', 'WAITLIST'].includes(status)) {
      throw new BadRequestException('Invalid guest registration status');
    }
    return this.prisma.guestRegistration.update({
      where: { id },
      data: { status }
    });
  }
}
