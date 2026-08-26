import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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

  async findPublicShowcase() {
    return this.prisma.community.findMany({
      where: {
        isActive: true,
        isShowcase: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        shortDescription: true,
        about: true,
        logo: true,
        heroBanner: true,
        theme: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    });
  }

  async findBySlug(slug: string) {
    const community = await this.prisma.community.findFirst({
      where: {
        OR: [
          { slug },
          { domain: slug }
        ]
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' }
        }
      }
    });
    if (!community) {
      throw new NotFoundException(`Community with slug or domain ${slug} not found`);
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
          ...(data.isShowcase !== undefined ? { isShowcase: data.isShowcase } : {}),
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
          
          if (data.adminName || data.adminPassword) {
            const updateData: any = {};
            if (data.adminName) updateData.name = data.adminName;
            if (data.adminPassword) {
              updateData.password = await bcrypt.hash(data.adminPassword, 10);
            }
            await prisma.user.update({
              where: { id: adminUserId },
              data: updateData
            });
          }
        } else {
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
          domain: data.domain || null,
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

  async resetData(id: string, options: string[]) {
    return this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      const deleteTransactions = options.includes('TRANSACTIONS') || options.includes('MEMBERS') || options.includes('PACKAGES');
      const deleteEvents = options.includes('EVENTS') || options.includes('MEMBERS');
      const deleteGallery = options.includes('GALLERY');
      const deleteMembers = options.includes('MEMBERS');
      const deletePackages = options.includes('PACKAGES') || options.includes('MEMBERS');
      const deleteMemberships = options.includes('MEMBERSHIPS') || options.includes('MEMBERS');

      // 1. DELETE TRANSACTIONS & WALLETS (Lowest level)
      if (deleteTransactions) {
        // Delete all transactions linked to wallets in this community
        const wallets = await prisma.sessionWallet.findMany({ where: { communityId: id }, select: { id: true } });
        const walletIds = wallets.map(w => w.id);
        if (walletIds.length > 0) {
          await prisma.sessionTransaction.deleteMany({ where: { walletId: { in: walletIds } } });
        }
        // Then delete the wallets themselves
        await prisma.sessionWallet.deleteMany({ where: { communityId: id } });
      }

      // 2. DELETE EVENT REGISTRATIONS & EVENTS
      if (deleteEvents) {
        const events = await prisma.event.findMany({ where: { communityId: id }, select: { id: true } });
        const eventIds = events.map(e => e.id);
        if (eventIds.length > 0) {
          await prisma.eventRegistration.deleteMany({ where: { eventId: { in: eventIds } } });
        }
        await prisma.event.deleteMany({ where: { communityId: id } });
      }

      // 3. DELETE GALLERY
      if (deleteGallery) {
        await prisma.galleryImage.deleteMany({ where: { communityId: id } });
      }

      // 4. DELETE PACKAGES, CATEGORIES, ACTIVITIES & GUEST REGISTRATIONS
      if (deletePackages) {
        // Delete guest registrations first as they reference SessionPackages and Community
        await prisma.guestRegistration.deleteMany({ where: { communityId: id } });
        
        // Find all activities in the community
        const activities = await prisma.activity.findMany({ where: { communityId: id }, select: { id: true } });
        const activityIds = activities.map(a => a.id);
        
        if (activityIds.length > 0) {
          // Find all categories linked to these activities
          const categories = await prisma.category.findMany({ where: { activityId: { in: activityIds } }, select: { id: true } });
          const categoryIds = categories.map(c => c.id);
          
          if (categoryIds.length > 0) {
            // Wallets and Transactions were deleted in Step 1, so packages are safe to delete
            await prisma.sessionPackage.deleteMany({ where: { categoryId: { in: categoryIds } } });
            await prisma.category.deleteMany({ where: { activityId: { in: activityIds } } });
          }
          await prisma.activity.deleteMany({ where: { communityId: id } });
        }
      }

      // 5. DELETE USER MEMBERSHIPS & MEMBERSHIPS
      if (deleteMemberships) {
        // Step 1 already deleted Wallets, which were the only dependents of UserMembership
        await prisma.userMembership.deleteMany({ where: { communityId: id } });
        await prisma.membership.deleteMany({ where: { communityId: id } });
      }

      // 6. DELETE MEMBERS (Except Admin)
      if (deleteMembers) {
        await prisma.communityMember.deleteMany({
          where: { 
            communityId: id,
            role: { not: 'COMMUNITY_ADMIN' }
          }
        });
      }
      
      return { success: true, message: 'Data reset successfully' };
    });
  }
}
