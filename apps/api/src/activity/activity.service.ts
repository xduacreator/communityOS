import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async createActivity(data: any) {
    const safeData = { ...data };
    delete safeData.community;
    delete safeData.categories;
    return this.prisma.activity.create({ data: safeData });
  }

  async findAllActivities(communityId: string) {
    return this.prisma.activity.findMany({
      where: { communityId },
      include: { categories: true }
    });
  }

  async createCategory(data: any) {
    const safeData = { ...data };
    delete safeData.activity;
    delete safeData.sessionPackages;
    return this.prisma.category.create({ data: safeData });
  }
}
