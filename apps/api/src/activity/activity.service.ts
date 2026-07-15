import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async createActivity(data: any) {
    return this.prisma.activity.create({ data });
  }

  async findAllActivities(communityId: string) {
    return this.prisma.activity.findMany({
      where: { communityId },
      include: { categories: true }
    });
  }

  async createCategory(data: any) {
    return this.prisma.category.create({ data });
  }
}
