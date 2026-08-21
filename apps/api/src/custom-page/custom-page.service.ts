import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomPageDto } from './dto/create-custom-page.dto';
import { UpdateCustomPageDto } from './dto/update-custom-page.dto';

@Injectable()
export class CustomPageService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCustomPageDto) {
    const existing = await this.prisma.customPage.findUnique({
      where: { slug: createDto.slug },
    });
    
    if (existing) {
      throw new ConflictException(`Custom page with slug '${createDto.slug}' already exists`);
    }

    return this.prisma.customPage.create({
      data: createDto,
    });
  }

  findAll() {
    return this.prisma.customPage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(idOrSlug: string) {
    const page = await this.prisma.customPage.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
    });

    if (!page) {
      throw new NotFoundException(`Custom page with ID or slug '${idOrSlug}' not found`);
    }

    return page;
  }

  async update(id: string, updateDto: UpdateCustomPageDto) {
    await this.findOne(id); // check if exists

    if (updateDto.slug) {
      const existing = await this.prisma.customPage.findFirst({
        where: { 
          slug: updateDto.slug,
          NOT: { id }
        },
      });
      if (existing) {
        throw new ConflictException(`Custom page with slug '${updateDto.slug}' already exists`);
      }
    }

    return this.prisma.customPage.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customPage.delete({
      where: { id },
    });
  }
}
