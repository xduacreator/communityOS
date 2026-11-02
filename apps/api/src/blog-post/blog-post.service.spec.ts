import { NotFoundException } from '@nestjs/common';
import { BlogPostService, readingMinutes, slugify } from './blog-post.service';

// sanitize-html ships ESM that Jest cannot load; its rules are covered by test/security-smoke.js
jest.mock('../security/html-sanitizer', () => ({
  sanitizeRichHtml: (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, ''),
}));

const post = (overrides: Record<string, unknown> = {}) => ({
  id: 'post-1',
  slug: 'tips-latihan',
  title: 'Tips Latihan',
  excerpt: null,
  content: '<p>Halo</p><script>alert(1)</script>',
  cluster: null,
  featuredImage: null,
  metaTitle: null,
  metaDescription: null,
  isPublished: true,
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-01'),
  ...overrides,
});

describe('BlogPostService', () => {
  const createPrismaMock = () => ({
    blogPost: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(({ data }) => post(data)),
      update: jest.fn(({ data }) => post(data)),
      delete: jest.fn(),
    },
  });

  it('slugifies Indonesian titles', () => {
    expect(slugify('  Cara Atur Gaji: 50/30/20 — Mudah!  ')).toBe('cara-atur-gaji-50-30-20-mudah');
    expect(slugify('Café Olahraga')).toBe('cafe-olahraga');
  });

  it('estimates reading time from text, at least one minute', () => {
    expect(readingMinutes('<p>satu dua</p>')).toBe(1);
    expect(readingMinutes(`<p>${'kata '.repeat(1000)}</p>`)).toBe(5);
  });

  it('only lists published posts publicly, without the article body', async () => {
    const prisma = createPrismaMock();
    prisma.blogPost.findMany.mockResolvedValue([post()]);
    const service = new BlogPostService(prisma as never);

    const result = await service.findPublished();

    expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublished: true } }),
    );
    expect(result[0]).not.toHaveProperty('content');
    expect(result[0].readingMinutes).toBe(1);
  });

  it('hides drafts from the public detail endpoint', async () => {
    const prisma = createPrismaMock();
    prisma.blogPost.findFirst.mockResolvedValue(null);
    const service = new BlogPostService(prisma as never);

    await expect(service.findPublishedOne('draft-slug')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.blogPost.findFirst).toHaveBeenCalledWith({
      where: { isPublished: true, OR: [{ id: 'draft-slug' }, { slug: 'draft-slug' }] },
    });
  });

  it('sanitizes content for admins too', async () => {
    const prisma = createPrismaMock();
    prisma.blogPost.findUnique.mockResolvedValue(post({ isPublished: false }));
    const service = new BlogPostService(prisma as never);

    const result = await service.findOneForAdmin('post-1');
    expect(result.content).toBe('<p>Halo</p>');
  });

  it('creates a slug from the title and makes it unique', async () => {
    const prisma = createPrismaMock();
    prisma.blogPost.findFirst
      .mockResolvedValueOnce({ id: 'other' })
      .mockResolvedValueOnce(null);
    const service = new BlogPostService(prisma as never);

    await service.create({ title: 'Tips Latihan', content: '<p>x</p>' });

    expect(prisma.blogPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: 'tips-latihan-2', content: '<p>x</p>' }),
    });
  });

  it('keeps a post its own slug when updating', async () => {
    const prisma = createPrismaMock();
    prisma.blogPost.findUnique.mockResolvedValue({ id: 'post-1' });
    prisma.blogPost.findFirst.mockResolvedValue(null);
    const service = new BlogPostService(prisma as never);

    await service.update('post-1', { slug: 'Tips Latihan' });

    expect(prisma.blogPost.findFirst).toHaveBeenCalledWith({
      where: { slug: 'tips-latihan', id: { not: 'post-1' } },
      select: { id: true },
    });
    expect(prisma.blogPost.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: expect.objectContaining({ slug: 'tips-latihan' }),
    });
  });
});
