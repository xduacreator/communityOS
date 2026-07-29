import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.community.findMany({
      include: {
        members: {
          where: { role: 'COMMUNITY_ADMIN' },
          include: { user: true }
        }
      }
    });
  }

  async findBySlug(slug: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      include: {
        memberships: {
          where: { status: 'ACTIVE' }
        }
      }
    });
    if (!community) {
      throw new NotFoundException(`Community with slug ${slug} not found`);
    }
    if (!community.isActive) {
      throw new ForbiddenException(`Community is currently suspended.`);
    }
    return community;
  }

  async update(id: string, data: any) {
    return this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      const community = await prisma.community.update({
        where: { id },
        data: {
          slug: data.slug,
          name: data.name,
          tagline: data.tagline,
          shortDescription: data.shortDescription,
          domain: data.domain,
          logo: data.logo,
          theme: data.theme,
          about: data.about,
          contactInfo: data.contactInfo,
          whatsappNumber: data.whatsappNumber,
          heroBanner: data.heroBanner,
          statMembersValue: data.statMembersValue,
          statEventsValue: data.statEventsValue,
          statCitiesValue: data.statCitiesValue,
          statAchievementsValue: data.statAchievementsValue,
          welcomeMessage: data.welcomeMessage,
          joinCtaLabel: data.joinCtaLabel,
          menuHomeLabel: data.menuHomeLabel,
          menuEventsLabel: data.menuEventsLabel,
          menuGalleryLabel: data.menuGalleryLabel,
          menuAboutLabel: data.menuAboutLabel,
          menuContactLabel: data.menuContactLabel,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords,
          registrationFields: data.registrationFields,
          registrationMode: data.registrationMode,
          paymentInstructions: data.paymentInstructions,
          qrisImageUrl: data.qrisImageUrl,
        },
      });

      // If admin details are provided, assign as community admin
      if (data.adminEmail) {
        let adminUserId;
        const existingUser = await prisma.user.findUnique({
          where: { email: data.adminEmail }
        });
        
        if (existingUser) {
          adminUserId = existingUser.id;
        } else {
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash(data.adminPassword || 'password123', 10);
          
          const newUser = await prisma.user.create({
            data: {
              email: data.adminEmail,
              name: data.adminName || 'Community Admin',
              password: hashedPassword
            }
          });
          adminUserId = newUser.id;
        }

        // Upsert membership
        const existingMembership = await prisma.communityMember.findUnique({
          where: { userId_communityId: { userId: adminUserId, communityId: id } }
        });

        if (existingMembership) {
          await prisma.communityMember.update({
            where: { id: existingMembership.id },
            data: { role: 'COMMUNITY_ADMIN', status: 'APPROVED' }
          });
        } else {
          await prisma.communityMember.create({
            data: {
              userId: adminUserId,
              communityId: id,
              role: 'COMMUNITY_ADMIN',
              status: 'APPROVED'
            }
          });
        }
      }

      return community;
    });
  }

  async create(data: any, userId: string) {
    return this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      const community = await prisma.community.create({
        data: {
          slug: data.slug,
          name: data.name,
          tagline: data.tagline,
          shortDescription: data.shortDescription,
          domain: data.domain,
          logo: data.logo,
          theme: data.theme,
          about: data.about,
          contactInfo: data.contactInfo,
          whatsappNumber: data.whatsappNumber,
          heroBanner: data.heroBanner,
          statMembersValue: data.statMembersValue,
          statEventsValue: data.statEventsValue,
          statCitiesValue: data.statCitiesValue,
          statAchievementsValue: data.statAchievementsValue,
          welcomeMessage: data.welcomeMessage,
          joinCtaLabel: data.joinCtaLabel,
          menuHomeLabel: data.menuHomeLabel,
          menuEventsLabel: data.menuEventsLabel,
          menuGalleryLabel: data.menuGalleryLabel,
          menuAboutLabel: data.menuAboutLabel,
          menuContactLabel: data.menuContactLabel,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords,
          registrationFields: data.registrationFields,
          registrationMode: data.registrationMode || "FREE",
        },
      });

      let adminUserId = userId;

      // If admin details are provided, create or find the admin user
      if (data.adminEmail) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.adminEmail }
        });
        
        if (existingUser) {
          adminUserId = existingUser.id;
        } else {
          // Need bcrypt for hashing
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash(data.adminPassword || 'password123', 10);
          
          const newUser = await prisma.user.create({
            data: {
              email: data.adminEmail,
              name: data.adminName || 'Community Admin',
              password: hashedPassword
            }
          });
          adminUserId = newUser.id;
        }
      }

      await prisma.communityMember.create({
        data: {
          userId: adminUserId,
          communityId: community.id,
          role: 'COMMUNITY_ADMIN',
          status: 'APPROVED',
        },
      });

      return community;
    });
  }

  async suspend(id: string) {
    return this.prisma.community.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    return this.prisma.community.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
