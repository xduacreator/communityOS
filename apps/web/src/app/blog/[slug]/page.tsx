/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, MessageCircle } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import CopyLinkButton from "@/components/site/CopyLinkButton";
import { ARTICLE_PROSE, formatBlogDate, tintFor, type BlogPost, type BlogPostSummary } from "@/lib/blog";
import { outfit } from "@/lib/fonts";
import { whatsappUrl } from "@/lib/home-content";
import { apiGet } from "@/lib/server-api";

const SITE_ORIGIN = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "latih.club"}`;

function getBlogPost(slug: string) {
  // Fresh on every request so an unpublished or deleted article disappears at once
  return apiGet<BlogPost | null>(`/blog-post/${encodeURIComponent(slug)}`, null, false);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Artikel tidak ditemukan" };

  const description = post.metaDescription || post.excerpt || `Membaca artikel ${post.title}`;
  return {
    // Resolves relative cover images to absolute URLs for link previews
    metadataBase: new URL(SITE_ORIGIN),
    title: post.metaTitle || `${post.title} | Latih.club Blog`,
    description,
    alternates: { canonical: `${SITE_ORIGIN}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle || post.title,
      description,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings, allPosts] = await Promise.all([
    getBlogPost(slug),
    apiGet<Record<string, string>>("/system-settings", {}, 5),
    apiGet<BlogPostSummary[]>("/blog-post", [], 60),
  ]);
  if (!post) notFound();

  const url = `${SITE_ORIGIN}/blog/${post.slug}`;
  // Same category first, then the newest
  const related = allPosts
    .filter((item) => item.id !== post.id)
    .sort((a, b) => Number(b.cluster === post.cluster) - Number(a.cluster === post.cluster))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: post.featuredImage ? [post.featuredImage.startsWith("http") ? post.featuredImage : `${SITE_ORIGIN}${post.featuredImage}`] : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: settings["platform.name"] || "Latih.Club" },
  };

  return (
    <div className={`${outfit.className} min-h-screen overflow-x-hidden bg-[#F6F6F2] text-[#111214]`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SiteHeader settings={settings} active="blog" />

      <article className="pb-16">
        <header className="mx-auto flex max-w-[820px] flex-col items-center gap-5 px-5 pt-8 text-center sm:px-8 md:pt-12">
          <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold shadow-[0_1px_0_#E6E6E0] transition hover:bg-[#FBFBF8]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Semua artikel
          </Link>
          {post.cluster && (
            <Link href={`/blog?kategori=${encodeURIComponent(post.cluster)}`} className={`rounded-full px-3 py-1 text-[13px] font-bold ${tintFor(post.cluster)}`}>
              {post.cluster}
            </Link>
          )}
          <h1 className="text-[36px] font-black leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[60px]">{post.title}</h1>
          {post.excerpt && <p className="max-w-[680px] text-lg leading-relaxed text-[#55585E] sm:text-xl">{post.excerpt}</p>}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold text-[#55585E]">
            <span>Tim {settings["platform.name"] || "Latih.Club"}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{formatBlogDate(post.createdAt)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {post.readingMinutes} menit baca
            </span>
          </div>
        </header>

        <figure className="mx-auto mt-10 max-w-[1080px] px-5 sm:px-8">
          {post.featuredImage ? (
            <img src={post.featuredImage} alt="" className="block max-h-[560px] w-full rounded-[28px] object-cover shadow-[0_40px_80px_-50px_rgba(17,18,20,0.45)]" />
          ) : (
            <div aria-hidden="true" className={`h-[180px] rounded-[28px] sm:h-[260px] ${tintFor(post.cluster || post.title)}`} />
          )}
        </figure>

        <div className="mx-auto mt-12 max-w-[740px] px-5 sm:px-8">
          <div
            className={ARTICLE_PROSE}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#E6E6E0] pt-6">
            <b className="text-base">Bagikan artikel ini</b>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2CE5B0] px-4 text-sm font-bold text-[#111214]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-bold shadow-[0_1px_0_#E6E6E0] transition hover:bg-[#FBFBF8]"
              >
                Facebook
              </a>
              <a
                href={`https://x.com/intent/post?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-bold shadow-[0_1px_0_#E6E6E0] transition hover:bg-[#FBFBF8]"
              >
                X
              </a>
              <CopyLinkButton url={url} />
            </div>
          </div>

          <aside className="relative mt-10 flex flex-col gap-4 overflow-hidden rounded-[28px] bg-[#111214] p-8 text-white sm:p-10">
            <span aria-hidden="true" className="absolute -right-4 -top-4 h-20 w-20 rotate-12 rounded-3xl bg-[#FFF0A6]" />
            <span aria-hidden="true" className="absolute bottom-6 right-16 h-6 w-6 rounded-full bg-[#2CE5B0]" />
            <b className="relative max-w-[460px] text-2xl leading-tight tracking-tight sm:text-3xl">
              Kelola klub latihanmu lebih rapi dengan <span className="text-[#2CE5B0]">Latih.Club</span>.
            </b>
            <p className="relative max-w-[480px] text-base text-[#BEC0C5]">
              Pendaftaran member, paket sesi, pembayaran, dan absensi dalam satu sistem. Chat tim kami untuk mulai.
            </p>
            <a
              href={whatsappUrl(settings)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex min-h-12 items-center self-start rounded-full bg-[#2CE5B0] px-6 text-base font-extrabold text-[#111214] transition hover:brightness-95"
            >
              Daftarkan Klub
            </a>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-black tracking-[-0.03em] md:text-4xl">Baca juga</h2>
            <Link href="/blog" className="inline-flex min-h-11 items-center text-base font-bold hover:underline">
              Semua artikel →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {related.map((item) => (
              <Link key={item.id} href={`/blog/${item.slug}`} className="group flex flex-col rounded-3xl bg-white p-2.5 shadow-[0_1px_0_#E6E6E0] transition hover:-translate-y-1">
                <div className="overflow-hidden rounded-2xl">
                  {item.featuredImage ? (
                    <img src={item.featuredImage} alt="" loading="lazy" className="block h-[170px] w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div aria-hidden="true" className={`flex h-[170px] items-end p-4 ${tintFor(item.cluster || item.title)}`}>
                      <span className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-[#111214]/15">{item.title}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 px-2.5 pb-3 pt-4">
                  <span className="text-[13px] font-semibold text-[#55585E]">
                    {[item.cluster, `${item.readingMinutes} mnt baca`].filter(Boolean).join(" · ")}
                  </span>
                  <b className="text-lg leading-snug">{item.title}</b>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter settings={settings} />
    </div>
  );
}
