import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LandingPageService {
  constructor(private prisma: PrismaService) {}

  async create(createLandingPageDto: CreateLandingPageDto) {
    const existing = await this.prisma.landingPage.findUnique({
      where: { slug: createLandingPageDto.slug }
    });
    if (existing) throw new ConflictException('Landing page with this slug already exists');

    return this.prisma.landingPage.create({
      data: createLandingPageDto,
    });
  }

  findAll() {
    return this.prisma.landingPage.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(idOrSlug: string) {
    const page = await this.prisma.landingPage.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });
    if (!page) throw new NotFoundException('Landing page not found');
    return page;
  }

  async update(id: string, updateLandingPageDto: UpdateLandingPageDto) {
    try {
      return await this.prisma.landingPage.update({
        where: { id },
        data: updateLandingPageDto,
      });
    } catch (e) {
      throw new NotFoundException('Landing page not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.landingPage.delete({
        where: { id },
      });
    } catch (e) {
      throw new NotFoundException('Landing page not found');
    }
  }
}
