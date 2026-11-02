export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cluster: string | null;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
}

export interface BlogPost extends BlogPostSummary {
  content: string;
}

// Article body styling, shared by the public article page and the CMS preview
export const ARTICLE_PROSE =
  "prose prose-lg max-w-none text-[#2A2C30] prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-[#111214] prose-h2:mt-12 prose-h2:text-[30px] prose-h3:text-2xl prose-p:leading-[1.8] prose-a:font-semibold prose-a:text-[#0B7A5E] prose-a:underline-offset-4 prose-strong:text-[#111214] prose-blockquote:rounded-2xl prose-blockquote:border-0 prose-blockquote:bg-[#D6FBEF] prose-blockquote:px-6 prose-blockquote:py-1 prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:text-[#24403A] prose-img:rounded-2xl prose-li:marker:text-[#0B7A5E] prose-table:text-base prose-th:bg-[#F1F1EC] prose-th:px-3 prose-td:px-3";

export const BLOG_CATEGORIES = ["Membership", "Absensi", "Akademi", "Retensi Member", "Operasional Klub", "Tips Latihan", "Bisnis Klub", "General"];

// Cheerful tints used for covers without an image and for category chips
const TINTS = ["bg-[#D6FBEF]", "bg-[#FFF0A6]", "bg-[#DCEBFF]", "bg-[#ECE3FF]", "bg-[#FFE2CF]", "bg-[#FFE0EC]"];

// Known categories get a fixed tint; anything else is hashed (FNV-1a) onto the palette
export function tintFor(value: string | null | undefined): string {
  const text = value || "";
  const known = BLOG_CATEGORIES.indexOf(text);
  if (known >= 0) return TINTS[known % TINTS.length];
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return TINTS[hash % TINTS.length];
}

export function formatBlogDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
