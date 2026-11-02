import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogPost } from '@prisma/client';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeRichHtml } from '../security/html-sanitizer';

const WORDS_PER_MINUTE = 200;

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// List rows carry reading time instead of the full article body
function summarize({ content, ...post }: BlogPost) {
  return { ...post, readingMinutes: readingMinutes(content) };
}

function withSafeContent(post: BlogPost) {
  const content = sanitizeRichHtml(post.content);
  return { ...post, content, readingMinutes: readingMinutes(content) };
}

@Injectable()
export class BlogPostService {
  constructor(private prisma: PrismaService) {}

  // Appends -2, -3, … when another post already uses the slug
  private async uniqueSlug(source: string, exceptId?: string): Promise<string> {
    const base = slugify(source) || 'artikel';
    let slug = base;
    for (let n = 2; ; n++) {
      const taken = await this.prisma.blogPost.findFirst({
        where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
        select: { id: true },
      });
      if (!taken) return slug;
      slug = `${base.slice(0, 95)}-${n}`;
    }
  }

  async create(dto: CreateBlogPostDto) {
    const post = await this.prisma.blogPost.create({
      data: {
        ...dto,
        slug: await this.uniqueSlug(dto.slug?.trim() || dto.title),
        content: sanitizeRichHtml(dto.content),
      },
    });
    return withSafeContent(post);
  }

  async findPublished() {
    const posts = await this.prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map(summarize);
  }

  async findPublishedOne(idOrSlug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { isPublished: true, OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return withSafeContent(post);
  }

  async findAllForAdmin() {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: [{ isPublished: 'asc' }, { updatedAt: 'desc' }],
    });
    return posts.map(summarize);
  }

  async findOneForAdmin(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');
    return withSafeContent(post);
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Blog post not found');
    const post = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.slug !== undefined && { slug: await this.uniqueSlug(dto.slug.trim() || dto.title || 'artikel', id) }),
        ...(dto.content !== undefined && { content: sanitizeRichHtml(dto.content) }),
      },
    });
    return withSafeContent(post);
  }

  async remove(id: string) {
    try {
      return await this.prisma.blogPost.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Blog post not found');
    }
  }
}
