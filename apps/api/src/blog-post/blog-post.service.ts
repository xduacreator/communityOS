import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeRichHtml } from '../security/html-sanitizer';

@Injectable()
export class BlogPostService {
  constructor(private prisma: PrismaService) {}

  async create(createBlogPostDto: CreateBlogPostDto) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { slug: createBlogPostDto.slug },
    });
    if (existing)
      throw new ConflictException('Blog post with this slug already exists');

    return this.prisma.blogPost.create({
      data: {
        ...createBlogPostDto,
        content: sanitizeRichHtml(createBlogPostDto.content),
      },
    });
  }

  async findAll() {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => ({
      ...post,
      content: sanitizeRichHtml(post.content),
    }));
  }

  async findOne(idOrSlug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return { ...post, content: sanitizeRichHtml(post.content) };
  }

  async update(id: string, updateBlogPostDto: UpdateBlogPostDto) {
    try {
      return await this.prisma.blogPost.update({
        where: { id },
        data: {
          ...updateBlogPostDto,
          ...(updateBlogPostDto.content !== undefined && {
            content: sanitizeRichHtml(updateBlogPostDto.content),
          }),
        },
      });
    } catch (e) {
      throw new NotFoundException('Blog post not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.blogPost.delete({
        where: { id },
      });
    } catch (e) {
      throw new NotFoundException('Blog post not found');
    }
  }
}
