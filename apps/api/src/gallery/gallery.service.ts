import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async create(communityId: string, data: { url: string; caption?: string }) {
    return this.prisma.galleryImage.create({
      data: {
        communityId,
        url: data.url,
        caption: data.caption,
      },
    });
  }

  async findAllByCommunity(communityId: string) {
    return this.prisma.galleryImage.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.galleryImage.delete({
        where: { id },
      });
    } catch (e) {
      throw new NotFoundException('Gallery image not found');
    }
  }
}
