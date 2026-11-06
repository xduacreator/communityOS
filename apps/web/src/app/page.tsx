/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Check, Download, Globe, Plus, QrCode, Tag, Users } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { formatBlogDate, tintFor, type BlogPostSummary } from "@/lib/blog";
import { outfit } from "@/lib/fonts";
import { HOME_FAQS, homeText, whatsappUrl } from "@/lib/home-content";
import { apiGet } from "@/lib/server-api";

interface ShowcaseCommunity {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  shortDescription?: string | null;
  heroBanner?: string | null;
}

interface ClubCard {
  href: string;
  name: string;
  label?: string;
  desc?: string;
  image?: string | null;
}

const SPORTS = [
  ["Lari", "bg-[#D6FBEF] -rotate-2"],
  ["Basket", "bg-[#FFF0A6] rotate-[1.5deg]"],
  ["Futsal", "bg-[#DCEBFF] -rotate-1"],
  ["Badminton", "bg-[#ECE3FF] rotate-2"],
  ["Renang", "bg-[#D6FBEF] -rotate-2"],
  ["Yoga & Pilates", "bg-[#FFF0A6] rotate-1"],
  ["Bela Diri", "bg-[#DCEBFF] -rotate-[1.5deg]"],
  ["Tenis", "bg-[#ECE3FF] rotate-2"],
  ["Kelas Kreatif", "bg-[#111214] text-white -rotate-1"],
] as const;

export default async function Home() {
  const [settings, showcase, posts] = await Promise.all([
    apiGet<Record<string, string>>("/system-settings", {}, 5),
    apiGet<ShowcaseCommunity[]>("/communities/public/showcase", [], 5),
    apiGet<BlogPostSummary[]>("/blog-post", [], 60),
  ]);

  const t = (key: Parameters<typeof homeText>[1]) => homeText(settings, key);
  const waUrl = whatsappUrl(settings);
  const latestPosts = posts.slice(0, 3);

  const clubs: ClubCard[] =
    showcase.length > 0
      ? showcase.map((club) => ({
          href: `/${club.slug}`,
          name: club.name,
          desc: club.shortDescription || club.tagline || undefined,
          image: club.heroBanner,
        }))
      : [1, 2, 3]
          .map((n) => ({
            href: `/${settings[`landing.showcase.${n}.id`] || ""}`,
            name: settings[`landing.showcase.${n}.name`] || "",
            label: settings[`landing.showcase.${n}.type`],
            desc: settings[`landing.showcase.${n}.desc`],
            image: settings[`landing.showcase.${n}.image`],
          }))
          .filter((club) => club.name && club.href !== "/");

  return (
    <div className={`${outfit.className} min-h-screen overflow-x-hidden bg-[#F6F6F2] text-[#111214]`}>
      <SiteHeader settings={settings} />

      {/* HERO */}
      <section id="top" className="mx-auto flex max-w-[1240px] flex-col items-center gap-6 px-5 pt-10 text-center sm:px-8 md:pt-16 lg:px-10">
        <span className="inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-[#55585E] shadow-[0_1px_0_#E6E6E0,0_8px_24px_-16px_rgba(17,18,20,0.25)]">
          <span className="rounded-full bg-[#2CE5B0] px-2.5 py-1 text-xs font-extrabold text-[#111214]">Baru</span>
          {t("home.hero.badge")}
        </span>
        <h1 className="max-w-[1100px] text-[44px] font-black leading-none tracking-[-0.04em] sm:text-6xl lg:text-[80px]">
          {t("home.hero.headline")}
          <br />
          <span className="relative inline-block">
            {t("home.hero.highlight")}
            <svg aria-hidden="true" viewBox="0 0 400 24" preserveAspectRatio="none" className="absolute -bottom-2.5 left-0 h-[18px] w-full">
              <path d="M4 16 C 90 4, 200 4, 396 12" fill="none" stroke="#2CE5B0" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="max-w-[600px] text-lg leading-relaxed text-[#55585E] sm:text-xl">{t("home.hero.subheadline")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 items-center gap-2.5 rounded-full bg-[#111214] px-7 text-lg font-bold text-white transition hover:bg-[#2a2c30]"
          >
            Daftarkan Klub
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2CE5B0]">
              <ArrowRight className="h-4 w-4 text-[#111214]" strokeWidth={2.8} aria-hidden="true" />
            </span>
          </a>
          {clubs[0] && (
            <Link
              href={clubs[0].href}
              className="inline-flex min-h-14 items-center rounded-full bg-white px-6 text-lg font-bold shadow-[inset_0_0_0_1px_#DDDDD6] transition hover:bg-[#FBFBF8]"
            >
              Lihat contoh klub
            </Link>
          )}
        </div>
        <span className="text-sm text-[#55585E]">{t("home.hero.note")}</span>

        {/* Showcase with stickers */}
        <div className="relative mt-6 w-full max-w-[1080px] pb-10 sm:mt-9 sm:pb-11">
          <figure className="overflow-hidden rounded-[22px] bg-white p-2 shadow-[0_1px_0_#E6E6E0,0_50px_100px_-50px_rgba(17,18,20,0.45)] sm:rounded-[28px] sm:p-2.5">
            <img
              src="/images/landing/microsite-home-desktop.webp"
              alt="Contoh microsite klub di Latih.Club"
              width={1920}
              height={1200}
              className="block h-auto w-full rounded-[16px] sm:rounded-[20px]"
            />
          </figure>
          <figure className="absolute -right-2 bottom-0 w-[120px] rotate-[4deg] rounded-[24px] bg-[#111214] p-1.5 shadow-[0_30px_60px_-20px_rgba(17,18,20,0.5)] sm:-right-4 sm:w-[210px] sm:rounded-[34px] sm:p-2">
            <img
              src="/images/landing/member-hub-mobile.webp"
              alt="Halaman member dengan tombol check-in"
              width={600}
              height={1298}
              className="block h-auto w-full rounded-[18px] sm:rounded-[27px]"
            />
          </figure>
          <div className="absolute -left-5 top-[22%] hidden -rotate-[4deg] items-center gap-2.5 rounded-[18px] bg-white px-4 py-3 text-left shadow-[0_20px_40px_-20px_rgba(17,18,20,0.35)] md:flex">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-[#2CE5B0]">
              <Check className="h-[18px] w-[18px]" strokeWidth={2.8} aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <b className="text-sm">Check-in berhasil</b>
              <span className="text-xs text-[#55585E]">Easy Run 8x · sisa 7 sesi</span>
            </span>
          </div>
          <div className="absolute bottom-1.5 left-[8%] hidden rotate-[3deg] items-center gap-2 rounded-full bg-[#FFF0A6] px-4 py-2.5 text-sm font-bold shadow-[0_16px_30px_-18px_rgba(17,18,20,0.4)] md:flex">
            <Users className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            Rudi + 2 teman · Rp 450.000
          </div>
          {clubs[0] && (
            <div className="absolute -top-4 right-[16%] hidden -rotate-[3deg] rounded-full bg-[#DCEBFF] px-4 py-2 text-sm font-bold shadow-[0_16px_30px_-18px_rgba(17,18,20,0.4)] md:block">
              latih.club{clubs[0].href}
            </div>
          )}
        </div>
      </section>

      {/* SPORTS STRIP */}
      <section aria-label="Jenis klub" className="mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-5 pt-7 sm:px-8 lg:px-10">
        <span className="text-[15px] font-semibold text-[#55585E]">Cocok untuk semua klub &amp; kelas latihan</span>
        <ul className="flex flex-wrap justify-center gap-2.5">
          {SPORTS.map(([label, style]) => (
            <li key={label} className={`rounded-full px-[18px] py-2.5 text-base font-bold ${style}`}>
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* BENTO */}
      <section id="fitur" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-4 px-5 pt-20 sm:px-8 md:pt-28 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <h2 className="max-w-[640px] text-4xl font-black leading-none tracking-[-0.035em] md:text-[56px]">
            {t("home.features.headline")}
          </h2>
          <p className="max-w-[360px] text-[17px] leading-relaxed text-[#55585E]">{t("home.features.subheadline")}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <article className="flex min-w-0 flex-[1.8_1_520px] flex-col gap-2.5 overflow-hidden rounded-[28px] bg-white px-6 pt-7 shadow-[0_1px_0_#E6E6E0] sm:px-8 sm:pt-8">
            <span className="self-start rounded-full bg-[#F1F1EC] px-3 py-1 text-[13px] font-bold">Untuk owner</span>
            <h3 className="text-[28px] font-extrabold tracking-tight sm:text-[30px]">{t("home.tile.owner.title")}</h3>
            <p className="max-w-[480px] text-base leading-relaxed text-[#55585E]">{t("home.tile.owner.desc")}</p>
            <img
              src="/images/landing/admin-dashboard.webp"
              alt="Dashboard admin Latih.Club"
              loading="lazy"
              className="mt-5 block h-[260px] w-full rounded-t-[18px] object-cover object-[75%_30%] shadow-[0_0_0_1px_#E6E6E0] sm:h-[340px]"
            />
          </article>
          <article className="relative flex min-w-0 flex-[1_1_320px] flex-col gap-2.5 overflow-hidden rounded-[28px] bg-[#D6FBEF] px-6 pt-7 sm:px-8 sm:pt-8">
            <span className="self-start rounded-full bg-white px-3 py-1 text-[13px] font-bold">Pesanan grup</span>
            <h3 className="max-w-[260px] pr-16 text-[28px] font-extrabold leading-tight tracking-tight sm:pr-0 sm:text-[30px]">{t("home.tile.group.title")}</h3>
            <p className="text-base leading-relaxed text-[#24403A]">{t("home.tile.group.desc")}</p>
            <span aria-hidden="true" className="absolute right-5 top-7 flex h-16 w-16 rotate-[10deg] items-center justify-center rounded-full bg-[#2CE5B0] text-[22px] font-black">×6</span>
            <img
              src="/images/landing/member-purchase-pax-mobile.webp"
              alt="Form pembelian paket dengan beberapa peserta"
              loading="lazy"
              className="mt-5 block h-[300px] w-[74%] self-center rounded-t-[26px] border-[7px] border-b-0 border-[#111214] object-cover object-[center_22%]"
            />
          </article>
        </div>

        <div className="flex flex-wrap gap-4">
          <article className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5 overflow-hidden rounded-[28px] bg-[#111214] px-6 pt-7 text-white sm:px-8 sm:pt-8">
            <span className="self-start rounded-full bg-[#2CE5B0] px-3 py-1 text-[13px] font-bold text-[#111214]">Untuk coach</span>
            <h3 className="text-[26px] font-extrabold tracking-tight">{t("home.tile.coach.title")}</h3>
            <p className="text-base leading-relaxed text-[#BEC0C5]">{t("home.tile.coach.desc")}</p>
            <img
              src="/images/landing/coach-participants.webp"
              alt="Halaman Peserta Sesi untuk coach"
              loading="lazy"
              className="mt-5 block h-[230px] w-full rounded-t-2xl object-cover object-[70%_45%]"
            />
          </article>
          <article className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5 overflow-hidden rounded-[28px] bg-[#FFF0A6] px-6 pt-7 sm:px-8 sm:pt-8">
            <span className="self-start rounded-full bg-white px-3 py-1 text-[13px] font-bold">Paket &amp; kuota</span>
            <h3 className="text-[26px] font-extrabold tracking-tight">{t("home.tile.packages.title")}</h3>
            <p className="text-base leading-relaxed text-[#4A4220]">{t("home.tile.packages.desc")}</p>
            <img
              src="/images/landing/microsite-sessions-desktop.webp"
              alt="Daftar paket di halaman klub"
              loading="lazy"
              className="mt-5 block h-[230px] w-full rounded-t-2xl object-cover object-[0%_35%]"
            />
          </article>
          <article className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5 overflow-hidden rounded-[28px] bg-[#DCEBFF] px-6 pt-7 sm:px-8 sm:pt-8">
            <span className="self-start rounded-full bg-white px-3 py-1 text-[13px] font-bold">Untuk member</span>
            <h3 className="text-[26px] font-extrabold tracking-tight">{t("home.tile.member.title")}</h3>
            <p className="text-base leading-relaxed text-[#24364F]">{t("home.tile.member.desc")}</p>
            <img
              src="/images/landing/member-hub-mobile.webp"
              alt="Halaman member dengan sisa sesi"
              loading="lazy"
              className="mt-5 block h-[230px] w-[70%] self-center rounded-t-3xl border-[7px] border-b-0 border-[#111214] object-cover object-[center_30%]"
            />
          </article>
        </div>

        <div className="flex flex-wrap gap-2 rounded-[28px] bg-white p-3 shadow-[0_1px_0_#E6E6E0]">
          {[
            [Tag, "bg-[#ECE3FF]", "Voucher & promo", "Nominal atau persen, dengan batas kuota."],
            [QrCode, "bg-[#D6FBEF]", "QRIS & transfer", "Member unggah bukti, admin tinggal cek."],
            [Globe, "bg-[#FFF0A6]", "Domain sendiri", "Subdomain atau domain milik klub."],
            [Download, "bg-[#DCEBFF]", "Export absensi", "Riwayat kehadiran ke CSV."],
          ].map(([Icon, tint, title, desc]) => {
            const FeatureIcon = Icon as typeof Tag;
            return (
              <div key={title as string} className="flex min-w-0 flex-[1_1_200px] items-start gap-3.5 p-[18px]">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${tint}`}>
                  <FeatureIcon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-1">
                  <b className="text-[17px]">{title as string}</b>
                  <span className="text-sm leading-normal text-[#55585E]">{desc as string}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW TO START */}
      <section id="mulai" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-8 px-5 pt-20 sm:px-8 md:pt-28 lg:px-10">
        <h2 className="text-4xl font-black leading-none tracking-[-0.035em] md:text-[52px]">Mulai dalam 3 langkah</h2>
        <ol className="flex flex-wrap gap-4">
          {[
            ["1", "bg-[#2CE5B0]", "Chat tim kami", "Ceritakan klubmu lewat WhatsApp. Kami siapkan microsite dan akun admin klubmu."],
            ["2", "bg-[#FFF0A6]", "Buat paket latihan", "Atur jumlah sesi, harga, kuota, dan kategori umur."],
            ["3", "bg-[#DCEBFF]", "Bagikan link-nya", "Kirim ke grup member. Mereka daftar, bayar, dan check-in sendiri."],
          ].map(([step, tint, title, desc]) => (
            <li key={step} className="flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-3xl bg-white p-7 shadow-[0_1px_0_#E6E6E0]">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-[22px] font-black ${tint}`}>{step}</span>
              <h3 className="text-[22px] font-extrabold">{title}</h3>
              <p className="text-base leading-relaxed text-[#55585E]">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CLUBS */}
      <section id="klub" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-7 px-5 pt-20 sm:px-8 md:pt-28 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-4xl font-black leading-none tracking-[-0.035em] md:text-[52px]">{t("home.clubs.headline")}</h2>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-base font-bold hover:underline">
            Daftarkan klubmu →
          </a>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {clubs.map((club) => (
            <Link key={club.href} href={club.href} className="group flex flex-col rounded-3xl bg-white p-2.5 shadow-[0_1px_0_#E6E6E0] transition hover:-translate-y-1">
              {club.image ? (
                <img src={club.image} alt={`Microsite ${club.name}`} loading="lazy" className="block h-[190px] w-full rounded-2xl object-cover object-top" />
              ) : (
                <div className="flex h-[190px] items-center justify-center rounded-2xl bg-[#F1F1EC] text-5xl font-black text-[#C9C9C2]">
                  {club.name.charAt(0)}
                </div>
              )}
              <div className="flex flex-col gap-1.5 px-2.5 pb-2.5 pt-4">
                <div className="flex items-center justify-between gap-2.5">
                  <b className="text-[19px]">{club.name}</b>
                  {club.label && <span className="shrink-0 rounded-full bg-[#D6FBEF] px-3 py-1 text-[13px] font-bold">{club.label}</span>}
                </div>
                {club.desc && <p className="line-clamp-2 text-[15px] leading-normal text-[#55585E]">{club.desc}</p>}
              </div>
            </Link>
          ))}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-3xl bg-[repeating-linear-gradient(135deg,#F6F6F2_0_12px,#EFEFE9_12px_24px)] p-8 text-center shadow-[inset_0_0_0_1.5px_#DDDDD6]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111214]">
              <Plus className="h-6 w-6 text-[#2CE5B0]" strokeWidth={2.8} aria-hidden="true" />
            </span>
            <b className="text-xl">Klubmu berikutnya</b>
            <span className="text-[15px] text-[#55585E]">Chat kami untuk mulai.</span>
          </a>
        </div>
      </section>

      {/* BLOG */}
      {latestPosts.length > 0 && (
        <section id="blog" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-7 px-5 pt-20 sm:px-8 md:pt-28 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2.5">
              <span className="self-start rounded-full bg-[#ECE3FF] px-3 py-1 text-[13px] font-bold">Blog</span>
              <h2 className="text-4xl font-black leading-none tracking-[-0.035em] md:text-[52px]">{t("home.blog.headline")}</h2>
            </div>
            <Link href="/blog" className="inline-flex min-h-11 items-center text-base font-bold hover:underline">
              Lihat semua artikel →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {latestPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="flex flex-col rounded-3xl bg-white p-2.5 shadow-[0_1px_0_#E6E6E0] transition hover:-translate-y-1">
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt="" loading="lazy" className="block h-[180px] w-full rounded-2xl object-cover" />
                ) : (
                  <div aria-hidden="true" className={`h-[180px] rounded-2xl ${tintFor(post.cluster || post.title)}`} />
                )}
                <div className="flex flex-col gap-2 px-2.5 pb-3 pt-4">
                  <span className="text-[13px] font-semibold text-[#55585E]">
                    {[post.cluster, formatBlogDate(post.createdAt), `${post.readingMinutes} mnt baca`].filter(Boolean).join(" · ")}
                  </span>
                  <b className="text-[19px] leading-snug">{post.title}</b>
                  {post.excerpt && <p className="line-clamp-2 text-[15px] leading-normal text-[#55585E]">{post.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-wrap gap-10 px-5 pt-20 sm:px-8 md:pt-28 lg:px-10">
        <h2 className="flex-[1_1_280px] text-4xl font-black leading-none tracking-[-0.035em] md:text-[52px]">Yang sering ditanya</h2>
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-2.5">
          {HOME_FAQS.map(([question, answer], index) => (
            <details key={question} open={index === 0} className="group rounded-[20px] bg-white px-6 py-5 shadow-[0_1px_0_#E6E6E0]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                {question}
                <Plus className="h-5 w-5 shrink-0 transition group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-base leading-relaxed text-[#55585E]">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[36px] bg-[#111214] px-6 py-14 text-center text-white sm:px-16 md:py-24">
          <span aria-hidden="true" className="absolute left-[6%] top-[18%] h-[54px] w-[54px] -rotate-[14deg] rounded-2xl bg-[#FFF0A6]" />
          <span aria-hidden="true" className="absolute right-[8%] top-[24%] h-10 w-10 rounded-full bg-[#DCEBFF]" />
          <span aria-hidden="true" className="absolute bottom-[16%] right-[14%] h-16 w-16 rotate-12 rounded-[20px] bg-[#ECE3FF]" />
          <span aria-hidden="true" className="absolute bottom-[18%] left-[12%] h-[30px] w-[30px] rounded-full bg-[#2CE5B0]" />
          <h2 className="relative max-w-[760px] text-[40px] font-black leading-none tracking-[-0.035em] sm:text-6xl lg:text-[72px]">
            {t("home.cta.headline")} <span className="text-[#2CE5B0]">{t("home.cta.highlight")}</span>
          </h2>
          <p className="relative max-w-[520px] text-lg leading-relaxed text-[#BEC0C5]">{t("home.cta.subheadline")}</p>
          <div className="relative flex flex-wrap justify-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center rounded-full bg-[#2CE5B0] px-8 text-lg font-extrabold text-[#111214] transition hover:brightness-95"
            >
              Daftarkan Klub
            </a>
            {clubs[0] && (
              <Link href={clubs[0].href} className="inline-flex min-h-14 items-center rounded-full px-7 text-lg font-bold text-white shadow-[inset_0_0_0_1px_#3A3D42] transition hover:bg-white/5">
                Lihat contoh klub
              </Link>
            )}
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} exampleHref={clubs[0]?.href} />
    </div>
  );
}
