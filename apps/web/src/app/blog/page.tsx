/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clock, Search, X } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { formatBlogDate, tintFor, type BlogPostSummary } from "@/lib/blog";
import { outfit } from "@/lib/fonts";
import { whatsappUrl } from "@/lib/home-content";
import { apiGet } from "@/lib/server-api";

export const metadata = {
  title: "Blog - Latih.club",
  description: "Artikel, tips, dan panduan untuk mengelola klub latihan, keanggotaan, dan akademi olahraga.",
};

function blogHref(params: { kategori?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params.kategori) search.set("kategori", params.kategori);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `/blog?${query}` : "/blog";
}

function Cover({ post, className }: { post: BlogPostSummary; className: string }) {
  return post.featuredImage ? (
    <img src={post.featuredImage} alt="" loading="lazy" className={`block w-full object-cover ${className}`} />
  ) : (
    <div aria-hidden="true" className={`flex items-end p-5 ${tintFor(post.cluster || post.title)} ${className}`}>
      <span className="line-clamp-2 text-2xl font-black leading-tight tracking-tight text-[#111214]/15">{post.title}</span>
    </div>
  );
}

function Meta({ post }: { post: BlogPostSummary }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-[#55585E]">
      {post.cluster && <span className={`rounded-full px-2.5 py-0.5 text-[#111214] ${tintFor(post.cluster)}`}>{post.cluster}</span>}
      <span>{formatBlogDate(post.createdAt)}</span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {post.readingMinutes} mnt baca
      </span>
    </span>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ kategori?: string; q?: string }> }) {
  const { kategori, q } = await searchParams;
  const query = (q || "").trim();
  const [settings, posts] = await Promise.all([
    apiGet<Record<string, string>>("/system-settings", {}, 5),
    apiGet<BlogPostSummary[]>("/blog-post", [], 60),
  ]);

  const categories = Array.from(new Set(posts.map((post) => post.cluster).filter((c): c is string => !!c)));
  const needle = query.toLowerCase();
  const filtered = posts.filter(
    (post) =>
      (!kategori || post.cluster === kategori) &&
      (!needle || [post.title, post.excerpt, post.cluster].some((text) => text?.toLowerCase().includes(needle))),
  );
  const isFiltered = !!kategori || !!query;
  // The newest post gets the big card only on the unfiltered list
  const featured = isFiltered ? undefined : filtered[0];
  const rest = isFiltered ? filtered : filtered.slice(1);

  return (
    <div className={`${outfit.className} min-h-screen overflow-x-hidden bg-[#F6F6F2] text-[#111214]`}>
      <SiteHeader settings={settings} active="blog" />

      {/* HERO */}
      <section className="mx-auto flex max-w-[1240px] flex-col items-center gap-5 px-5 pt-10 text-center sm:px-8 md:pt-14 lg:px-10">
        <span className="rounded-full bg-[#ECE3FF] px-3 py-1 text-[13px] font-bold">Blog Latih.Club</span>
        <h1 className="max-w-[860px] text-[42px] font-black leading-none tracking-[-0.04em] sm:text-6xl lg:text-[72px]">
          Tips &amp; cerita seputar <span className="relative inline-block">klub latihan.
            <svg aria-hidden="true" viewBox="0 0 400 24" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-4 w-full">
              <path d="M4 16 C 90 4, 200 4, 396 12" fill="none" stroke="#2CE5B0" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="max-w-[560px] text-lg leading-relaxed text-[#55585E]">
          Panduan praktis mengelola member, paket latihan, absensi, dan bisnis klub — dari tim Latih.Club.
        </p>
        <form action="/blog" method="get" role="search" className="mt-2 flex w-full max-w-[520px] items-center gap-2 rounded-full bg-white p-1.5 shadow-[0_1px_0_#E6E6E0,0_12px_30px_-20px_rgba(17,18,20,0.35)]">
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          <label htmlFor="blog-search" className="sr-only">Cari artikel</label>
          <Search className="ml-3 h-5 w-5 shrink-0 text-[#55585E]" aria-hidden="true" />
          <input
            id="blog-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Cari artikel, mis. absensi"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-[#8A8D93]"
          />
          <button type="submit" className="min-h-11 rounded-full bg-[#111214] px-5 text-[15px] font-bold text-white transition hover:bg-[#2a2c30]">
            Cari
          </button>
        </form>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <nav aria-label="Kategori artikel" className="mx-auto flex max-w-[1240px] flex-wrap justify-center gap-2 px-5 pt-8 sm:px-8 lg:px-10">
          <Link
            href={blogHref({ q: query })}
            aria-current={!kategori ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-[15px] font-bold transition ${!kategori ? "bg-[#111214] text-white" : "bg-white shadow-[0_1px_0_#E6E6E0] hover:bg-[#FBFBF8]"}`}
          >
            Semua
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={blogHref({ kategori: category, q: query })}
              aria-current={kategori === category ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-[15px] font-bold transition ${kategori === category ? "bg-[#111214] text-white" : `${tintFor(category)} hover:brightness-95`}`}
            >
              {category}
            </Link>
          ))}
        </nav>
      )}

      <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 pb-20 pt-10 sm:px-8 md:pb-28 lg:px-10">
        {isFiltered && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-[#55585E]">
              {filtered.length} artikel
              {query && <> untuk &ldquo;<span className="text-[#111214]">{query}</span>&rdquo;</>}
              {kategori && <> di kategori <span className="text-[#111214]">{kategori}</span></>}
            </p>
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold shadow-[0_1px_0_#E6E6E0]">
              <X className="h-4 w-4" aria-hidden="true" />
              Hapus filter
            </Link>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-6 py-16 text-center shadow-[0_1px_0_#E6E6E0]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0A6]">
              <Search className="h-6 w-6" aria-hidden="true" />
            </span>
            <b className="text-xl">{isFiltered ? "Artikel tidak ditemukan" : "Belum ada artikel"}</b>
            <p className="max-w-[420px] text-[15px] text-[#55585E]">
              {isFiltered ? "Coba kata kunci lain atau lihat semua artikel." : "Artikel pertama sedang disiapkan. Mampir lagi nanti, ya!"}
            </p>
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="group flex flex-wrap overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_#E6E6E0] transition hover:-translate-y-1">
                <div className="min-w-0 flex-[1.3_1_420px] overflow-hidden">
                  <Cover post={featured} className="h-[260px] transition duration-500 group-hover:scale-[1.03] sm:h-[380px]" />
                </div>
                <div className="flex min-w-0 flex-[1_1_320px] flex-col justify-center gap-4 p-7 sm:p-10">
                  <span className="self-start rounded-full bg-[#2CE5B0] px-3 py-1 text-[13px] font-extrabold">Terbaru</span>
                  <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-[40px]">{featured.title}</h2>
                  {featured.excerpt && <p className="line-clamp-3 text-[17px] leading-relaxed text-[#55585E]">{featured.excerpt}</p>}
                  <Meta post={featured} />
                  <span className="mt-2 inline-flex items-center gap-2 text-base font-bold">
                    Baca artikel
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111214] text-[#2CE5B0] transition group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                {rest.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col rounded-3xl bg-white p-2.5 shadow-[0_1px_0_#E6E6E0] transition hover:-translate-y-1">
                    <div className="overflow-hidden rounded-2xl">
                      <Cover post={post} className="h-[200px] transition duration-500 group-hover:scale-[1.04]" />
                    </div>
                    <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3 pt-4">
                      <Meta post={post} />
                      <b className="text-xl leading-snug">{post.title}</b>
                      {post.excerpt && <p className="line-clamp-2 text-[15px] leading-normal text-[#55585E]">{post.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-[#111214] px-7 py-9 text-white sm:px-10">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2">
            <b className="text-2xl tracking-tight sm:text-3xl">Punya klub latihan?</b>
            <p className="text-base text-[#BEC0C5]">Kelola member, paket, dan absensi klubmu di Latih.Club. Pendaftaran dibantu tim kami.</p>
          </div>
          <a
            href={whatsappUrl(settings)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 items-center rounded-full bg-[#2CE5B0] px-7 text-lg font-extrabold text-[#111214] transition hover:brightness-95"
          >
            Daftarkan Klub
          </a>
        </div>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
