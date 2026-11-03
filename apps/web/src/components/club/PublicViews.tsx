"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, LogIn, MessageCircle, Share2, X } from "lucide-react";
import type { Event } from "../../types";
import {
  bestValuePackageId,
  clubFaq,
  formatDate,
  packageNeedsMembership,
  perSessionPrice,
  rupiah,
  whatsappLink,
} from "../../lib/club";
import {
  ArrowBubble,
  ClubLogo,
  EmptyCard,
  LoginLink,
  MobileTopBar,
  PackageGrid,
  SectionHead,
  Skeleton,
  StatsRow,
  btnClub,
  btnDark,
  btnLight,
  card,
  pageTitle,
} from "./ClubUI";
import { clubHref, type ClubCtx } from "./types";

const page = "mx-auto w-full max-w-[1240px] px-4 md:px-8";

function joinNote(ctx: ClubCtx): string {
  const prices = ctx.packages.map((p) => p.memberPrice || 0).filter((v) => v > 0);
  const from = prices.length ? ` · paket mulai ${rupiah(Math.min(...prices))}` : "";
  return ctx.community.registrationMode === "PAID" ? `Gabung dengan membership${from}` : `Daftar member gratis${from}`;
}

function upcoming(events: Event[]): Event[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events.filter((e) => new Date(e.date) >= today).sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

function HeroImage({ ctx, className }: { ctx: ClubCtx; className: string }) {
  return ctx.community.heroBanner ? (
    <img src={ctx.community.heroBanner} alt={`Kegiatan ${ctx.community.name}`} className={className} />
  ) : (
    <div aria-hidden="true" className={`${className} bg-[var(--club)]`} />
  );
}

function JoinCta({ ctx, className }: { ctx: ClubCtx; className: string }) {
  if (ctx.isLoggedIn && ctx.status) {
    return (
      <Link href={clubHref(ctx.base, "/member")} className={className}>
        Halaman member
        <ArrowBubble size={28} />
      </Link>
    );
  }
  return <>{ctx.joinButton(className, ctx.labels.join, <ArrowBubble size={28} />)}</>;
}

/** Floating join bar above the bottom tabs on phones */
function MobileJoinBar({ ctx }: { ctx: ClubCtx }) {
  if (ctx.isLoggedIn && ctx.status) return null;
  const prices = ctx.packages.map((p) => p.memberPrice || 0).filter((v) => v > 0);
  return (
    <div className="fixed inset-x-3 bottom-[86px] z-[80] flex items-center justify-between gap-2.5 rounded-full bg-[#111214] py-[7px] pl-5 pr-[7px] text-white shadow-[0_20px_40px_-18px_rgba(17,18,20,0.6)] md:hidden">
      <span className="flex min-w-0 flex-col">
        <b className="truncate text-[15px]">{prices.length ? `Mulai ${rupiah(Math.min(...prices))}` : ctx.community.name}</b>
        <span className="truncate text-xs text-[#BEC0C5]">
          {ctx.community.registrationMode === "PAID" ? "gabung dengan membership" : "daftar member gratis"}
        </span>
      </span>
      {ctx.joinButton(
        "inline-flex min-h-12 shrink-0 items-center rounded-full bg-[var(--club)] px-5 text-[15px] font-extrabold text-[var(--club-on)]",
        ctx.labels.join,
        <span />,
      )}
    </div>
  );
}

function WhatsAppButton({ ctx, className, label = "Chat WhatsApp" }: { ctx: ClubCtx; className: string; label?: string }) {
  const href = whatsappLink(ctx.community.whatsappNumber, `Halo pengurus ${ctx.community.name}, saya mau tanya.`);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
      {label}
    </a>
  );
}

// ---------- Beranda ----------

export function HomeView({ ctx }: { ctx: ClubCtx }) {
  const c = ctx.community;
  const cheapest = useMemo(() => [...ctx.packages].sort((a, b) => (a.memberPrice || 0) - (b.memberPrice || 0)).slice(0, 3), [ctx.packages]);
  const best = bestValuePackageId(ctx.packages);
  const nextEvent = upcoming(ctx.events)[0];

  return (
    <>
      {/* Phone hero */}
      <section className="relative h-[540px] text-white md:hidden">
        <HeroImage ctx={ctx} className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,18,20,0.4)_0%,rgba(17,18,20,0)_26%,rgba(17,18,20,0)_40%,rgba(17,18,20,0.85)_100%)]" />
        <div className="relative flex items-center justify-between px-3.5 py-3">
          <span className="flex min-w-0 items-center gap-2 rounded-full bg-white/95 py-1 pl-1 pr-3 text-[#111214]">
            <ClubLogo community={c} size={30} />
            <b className="truncate text-sm font-bold">{c.name}</b>
          </span>
          <LoginLink ctx={ctx} onDark />
        </div>
        <div className="absolute inset-x-5 bottom-12 flex flex-col gap-3">
          {c.isActive && (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/20 px-3 py-1.5 text-[13px] font-bold backdrop-blur">
              <span className="h-[7px] w-[7px] rounded-full bg-[#2CE5B0]" />
              {c.registrationMode === "PAID" ? "Pendaftaran via membership" : "Pendaftaran dibuka"}
            </span>
          )}
          <h1 className="text-[50px] font-black leading-[0.95] tracking-[-0.045em] [overflow-wrap:anywhere]">{c.name}</h1>
          {c.tagline && <p className="text-[19px] font-bold leading-snug">{c.tagline}</p>}
          {c.shortDescription && <p className="text-[15px] leading-normal text-[#E8E9EC]">{c.shortDescription}</p>}
        </div>
      </section>
      <div className="relative -mt-6 rounded-t-[24px] bg-[#F6F6F2] px-4 pt-5 md:hidden">
        <StatsRow ctx={ctx} />
      </div>

      {/* Desktop hero */}
      <section className={`${page} hidden flex-wrap items-center gap-12 pt-8 md:flex`}>
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
          {c.isActive && (
            <span className="inline-flex items-center gap-2.5 self-start rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-[#55585E] shadow-[0_1px_0_#E6E6E0,0_8px_24px_-16px_rgba(17,18,20,0.25)]">
              <span className="rounded-full bg-[#2CE5B0] px-2.5 py-1 text-xs font-extrabold text-[#111214]">Buka</span>
              {c.registrationMode === "PAID" ? "Pendaftaran via membership" : "Pendaftaran member dibuka"}
            </span>
          )}
          <h1 className="text-[64px] font-black leading-[0.92] tracking-[-0.05em] [overflow-wrap:anywhere] lg:text-[88px]">
            {c.name}
            <span className="text-[var(--club)]">.</span>
          </h1>
          <div className="flex max-w-[500px] flex-col gap-2">
            {c.tagline && <b className="text-[23px] font-bold tracking-[-0.01em]">{c.tagline}</b>}
            {c.shortDescription && <p className="text-[19px] leading-relaxed text-[#55585E]">{c.shortDescription}</p>}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <JoinCta ctx={ctx} className={`${btnDark} min-h-14 pl-7 pr-2.5 text-lg`} />
            <Link href={clubHref(ctx.base, "/paket")} className={`${btnLight} min-h-14 text-lg`}>
              Lihat paket
            </Link>
          </div>
          <StatsRow ctx={ctx} variant="plain" />
        </div>
        <div className="relative min-w-0 flex-[1_1_480px] pb-6">
          <div className="rounded-[32px] bg-white p-2.5 shadow-[0_1px_0_#E6E6E0,0_50px_100px_-50px_rgba(17,18,20,0.45)]">
            <HeroImage ctx={ctx} className="block h-[480px] w-full rounded-[24px] object-cover" />
          </div>
          {cheapest[0] && (
            <span className="absolute bottom-0 right-7 rotate-[3deg] rounded-full bg-[#FFF0A6] px-[18px] py-3 text-base font-extrabold shadow-[0_16px_30px_-18px_rgba(17,18,20,0.4)]">
              Paket mulai {rupiah(cheapest[0].memberPrice)}
            </span>
          )}
        </div>
      </section>

      {/* Packages + next event */}
      <section className={`${page} grid grid-cols-1 gap-10 pt-10 md:grid-cols-12 md:gap-5 md:pt-24`}>
        <div className={`flex flex-col gap-3.5 ${nextEvent ? "md:col-span-8" : "md:col-span-12"}`}>
          <SectionHead title="Paket" href={clubHref(ctx.base, "/paket")} linkLabel={ctx.packages.length > 3 ? `Semua ${ctx.packages.length} paket` : "Semua paket"} />
          {ctx.loadingPackages && cheapest.length === 0 ? (
            <Skeleton rows={1} />
          ) : cheapest.length === 0 ? (
            <EmptyCard title="Belum ada paket" body="Paket latihan dari klub akan muncul di sini." />
          ) : (
            <div className={`${card} px-4 py-1 md:px-6`}>
              {cheapest.map((p, i) => (
                <Link
                  key={p.id}
                  href={clubHref(ctx.base, "/paket")}
                  className={`flex items-center gap-3 py-3.5 md:py-5 ${i < cheapest.length - 1 ? "border-b border-[#EEEEE8]" : ""}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="text-base md:text-xl">{p.name}</b>
                    <span className="text-[13px] text-[#55585E] md:text-[15px]">
                      {p.totalSession} sesi · {p.validDays} hari
                      {p.id === best ? " · paling hemat per sesi" : packageNeedsMembership(c, p) ? " · perlu membership" : ""}
                    </span>
                  </span>
                  <b className="shrink-0 text-base md:text-[22px]">{rupiah(p.memberPrice)}</b>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8A8C91]" strokeWidth={2.4} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </div>
        {nextEvent && (
          <div className="flex flex-col gap-3.5 md:col-span-4">
            <SectionHead title="Event terdekat" href={clubHref(ctx.base, "/event")} />
            <Link href={clubHref(ctx.base, "/event")} className={`${card} flex items-center gap-3.5 p-4 md:flex-col md:items-start md:p-6`}>
              <DateBlock date={nextEvent.date} accent />
              <span className="flex min-w-0 flex-col gap-1">
                <b className="text-base leading-snug md:text-xl">{nextEvent.title}</b>
                <span className="text-[13px] text-[#55585E] md:text-[15px]">
                  {formatDate(nextEvent.date, { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                  {nextEvent.location ? ` · ${nextEvent.location}` : ""}
                </span>
              </span>
            </Link>
          </div>
        )}
      </section>

      {/* Closing */}
      <section className={`${page} pt-10 md:pt-24`}>
        <div className="flex flex-col gap-3 rounded-[26px] bg-[#111214] p-6 text-white md:flex-row md:items-center md:justify-between md:gap-6 md:rounded-[36px] md:px-14 md:py-12">
          <div className="flex flex-col gap-2">
            <b className="text-[26px] font-black leading-tight tracking-[-0.03em] md:text-5xl">Siap latihan bareng?</b>
            <span className="text-[15px] text-[#D4D5D9] md:text-lg">{joinNote(ctx)}.</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <WhatsAppButton ctx={ctx} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-[15px] font-bold text-white md:min-h-14 md:text-[17px]" />
            <span className="hidden md:inline-flex">
              <JoinCta ctx={ctx} className={`${btnClub} min-h-14 pl-6 pr-2 text-[17px]`} />
            </span>
          </div>
        </div>
      </section>
      <MobileJoinBar ctx={ctx} />
    </>
  );
}

function DateBlock({ date, accent = false }: { date: string; accent?: boolean }) {
  const d = new Date(date);
  return (
    <span
      className={`flex h-16 w-[60px] shrink-0 flex-col items-center justify-center rounded-2xl ${accent ? "bg-[var(--club)] text-[var(--club-on)]" : "bg-[#F1F1EC] text-[#111214]"}`}
    >
      <b className="text-2xl font-black leading-none">{d.getDate()}</b>
      <span className="text-xs font-bold">{d.toLocaleDateString("id-ID", { month: "short" })}</span>
    </span>
  );
}

// ---------- Paket ----------

export function PackagesView({ ctx }: { ctx: ClubCtx }) {
  const c = ctx.community;
  const categories = useMemo(
    () => Array.from(new Set(ctx.packages.map((p) => p.category?.name).filter(Boolean) as string[])),
    [ctx.packages],
  );
  const [cat, setCat] = useState("Semua");
  const shown = cat === "Semua" ? ctx.packages : ctx.packages.filter((p) => p.category?.name === cat);
  const paid = c.registrationMode === "PAID";
  const memberOnly = ctx.packages.filter((p) => packageNeedsMembership(c, p)).length;
  const memberships = (c.memberships || []).filter((m) => m.status === "ACTIVE");

  return (
    <>
      <MobileTopBar ctx={ctx} right={<LoginLink ctx={ctx} />} />
      <section className={`${page} flex flex-col gap-4 pt-5 md:gap-7 md:pt-12`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h1 className={pageTitle}>{ctx.labels.packages}</h1>
            <p className="max-w-[560px] text-base leading-relaxed text-[#55585E] md:text-[19px]">
              Harga per orang. Sesi dipakai kapan saja selama masa berlaku, dan bisa sekalian untuk hingga 5 teman.
            </p>
          </div>
          {categories.length > 1 && (
            <div role="group" aria-label="Filter kategori" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#EAEAE3] p-1">
              {["Semua", ...categories].map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={cat === k}
                  onClick={() => setCat(k)}
                  className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold md:min-h-11 md:px-5 md:text-[15px] ${cat === k ? "bg-white shadow-[0_1px_2px_rgba(17,18,20,0.12)]" : ""}`}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
        <PackageGrid ctx={ctx} packages={shown} />
      </section>

      {memberships.length > 0 && (memberOnly > 0 || paid) && (
        <section className={`${page} pt-8`}>
          <div className="flex flex-col gap-4 rounded-[26px] bg-[#111214] p-5 text-white md:flex-row md:items-center md:justify-between md:gap-6 md:rounded-[30px] md:px-8 md:py-7">
            <div className="flex max-w-[560px] flex-col gap-1.5">
              <b className="text-[22px] tracking-[-0.02em] md:text-[26px]">{paid ? "Semua paket butuh membership." : "Perlu jadi member dulu?"}</b>
              <span className="text-[15px] leading-relaxed text-[#D4D5D9] md:text-base">
                {paid
                  ? "Klub ini memakai pendaftaran berbayar. Membership bisa dibayar sekaligus dengan paket pertamamu."
                  : `Daftar member gratis. Membership berbayar hanya untuk ${memberOnly} paket bertanda "Perlu membership", sekaligus dapat harga spesial.`}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {memberships.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 rounded-[22px] bg-white/10 py-3.5 pl-5 pr-3.5">
                  <span className="flex min-w-0 flex-col">
                    <b className="text-[17px]">
                      {m.name} · {rupiah(m.price)}
                    </b>
                    <span className="text-sm text-[#D4D5D9]">
                      {m.durationDays} hari{m.benefit ? ` · ${m.benefit}` : ""}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={`${page} flex flex-col gap-4 pt-10 md:gap-6 md:pt-20`}>
        <h2 className="text-[28px] font-black tracking-[-0.04em] md:text-[44px]">Cara gabung</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-3.5">
          {joinSteps(ctx).map((s, i) => (
            <div key={s.t} className={`${card} flex gap-3 p-4 md:flex-col md:p-6`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black md:h-10 md:w-10 md:text-lg ${i === 0 ? "bg-[var(--club)] text-[var(--club-on)]" : "bg-[#111214] text-white"}`}
              >
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <b className="text-base md:text-[19px]">{s.t}</b>
                <span className="text-sm leading-relaxed text-[#55585E] md:text-[15px]">{s.d}</span>
              </span>
            </div>
          ))}
          <PaymentCard ctx={ctx} />
        </div>
      </section>
      <MobileJoinBar ctx={ctx} />
    </>
  );
}

function joinSteps(ctx: ClubCtx) {
  return ctx.community.registrationMode === "PAID"
    ? [
        { t: "Pilih membership & paket", d: "Keduanya bisa dibayar sekaligus. Tambah hingga 5 teman di paket umum." },
        { t: "Transfer & unggah bukti", d: "Pakai kode voucher bila punya. Pengurus mengonfirmasi pembayaran." },
        { t: "Datang & check-in dari HP", d: "Sisa sesi tiap orang tercatat otomatis." },
      ]
    : [
        { t: "Daftar member (gratis)", d: "Isi formulir klub, lalu tunggu persetujuan pengurus." },
        { t: "Pilih paket & bayar", d: "Untuk sendiri atau sekalian teman. Pakai voucher bila punya." },
        { t: "Datang & check-in dari HP", d: "Sisa sesi tiap orang tercatat otomatis." },
      ];
}

function PaymentCard({ ctx }: { ctx: ClubCtx }) {
  const c = ctx.community;
  return (
    <div className={`${card} flex flex-col gap-2.5 p-4 ring-2 ring-inset ring-[var(--club-soft)] md:p-6`}>
      <b className="text-base md:text-[19px]">Pembayaran</b>
      <p className="whitespace-pre-line text-sm leading-relaxed text-[#3A3C41] md:text-[15px]">
        {c.paymentInstructions || "Instruksi transfer ditampilkan saat checkout. Unggah bukti transfer setelah membayar."}
      </p>
      {c.qrisImageUrl && <span className="text-sm font-bold">Bisa juga via QRIS saat checkout.</span>}
    </div>
  );
}

// ---------- Event ----------

export function EventsView({ ctx }: { ctx: ClubCtx }) {
  const [tab, setTab] = useState<"up" | "past">("up");
  const next = upcoming(ctx.events);
  const past = ctx.events.filter((e) => !next.includes(e)).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const list = tab === "up" ? next : past;
  return (
    <>
      <MobileTopBar ctx={ctx} right={<LoginLink ctx={ctx} />} />
      <section className={`${page} flex max-w-[900px] flex-col gap-4 pt-5 md:gap-6 md:pt-12`}>
        <h1 className={pageTitle}>{ctx.labels.events}</h1>
        <p className="text-base leading-relaxed text-[#55585E] md:text-lg">Kegiatan klub di luar sesi latihan rutin.</p>
        <div role="group" aria-label="Pilih waktu" className="grid grid-cols-2 gap-1 rounded-full bg-[#EAEAE3] p-1 md:max-w-sm">
          {(
            [
              ["up", "Mendatang"],
              ["past", "Sudah lewat"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className={`min-h-10 rounded-full text-sm font-bold ${tab === k ? "bg-white shadow-[0_1px_2px_rgba(17,18,20,0.12)]" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        {ctx.loadingEvents && ctx.events.length === 0 ? (
          <Skeleton rows={2} />
        ) : list.length === 0 ? (
          <EmptyCard
            title={tab === "up" ? "Belum ada event mendatang" : "Belum ada event sebelumnya"}
            body="Event baru akan muncul di sini. Sementara itu, ikut sesi latihan rutin yuk."
            action={
              <Link href={clubHref(ctx.base, "/paket")} className={`${btnLight} mt-1 min-h-11 text-sm`}>
                Lihat paket latihan
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {list.map((e, i) => (
              <article key={e.id} className={`${card} flex flex-col gap-3 p-4 md:p-6`}>
                <div className="flex gap-3.5">
                  <DateBlock date={e.date} accent={tab === "up" && i === 0} />
                  <span className="flex min-w-0 flex-col gap-1">
                    <b className="text-[17px] leading-snug md:text-xl">{e.title}</b>
                    <span className="text-[13px] text-[#55585E] md:text-sm">
                      {formatDate(e.date, { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </span>
                  </span>
                </div>
                {e.description && <p className="whitespace-pre-line text-sm leading-relaxed text-[#3A3C41] md:text-[15px]">{e.description}</p>}
                {tab === "up" && (
                  <button type="button" onClick={() => ctx.registerEvent(e.id)} className={`${btnDark} min-h-11 text-sm`}>
                    Daftar event
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ---------- Tentang ----------

export function AboutView({ ctx }: { ctx: ClubCtx }) {
  const c = ctx.community;
  return (
    <>
      <MobileTopBar ctx={ctx} right={<LoginLink ctx={ctx} />} />
      <section className={`${page} flex max-w-[900px] flex-col gap-5 pt-5 md:gap-7 md:pt-12`}>
        <h1 className={pageTitle}>{ctx.labels.about}</h1>
        <HeroImage ctx={ctx} className="block h-[220px] w-full rounded-[24px] object-cover md:h-[380px] md:rounded-[32px]" />
        {c.about ? (
          <p className="whitespace-pre-line text-[17px] leading-[1.7] text-[#3A3C41] md:text-[19px]">{c.about}</p>
        ) : (
          c.shortDescription && <p className="text-[17px] leading-[1.7] text-[#3A3C41] md:text-[19px]">{c.shortDescription}</p>
        )}
        {c.welcomeMessage && (
          <figure className={`${card} flex flex-col gap-3 p-5 md:flex-row md:gap-6 md:p-10`}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="var(--club)" aria-hidden="true" className="shrink-0">
              <path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 4-2 5-4 5zm11 0c3 0 7-1 7-8V5h-7v8h4c0 4-2 5-4 5z" />
            </svg>
            <div className="flex flex-col gap-3">
              <blockquote className="whitespace-pre-line text-lg font-semibold leading-normal md:text-[26px] md:leading-snug md:tracking-[-0.01em]">
                {c.welcomeMessage}
              </blockquote>
              <figcaption className="text-[13px] text-[#55585E] md:text-base">Pengurus {c.name}</figcaption>
            </div>
          </figure>
        )}
        <StatsRow ctx={ctx} />
        <Link href={clubHref(ctx.base, "/paket")} className={`${btnDark} min-h-[54px] pr-2 text-base md:self-start`}>
          Lihat paket latihan
          <ArrowBubble size={28} />
        </Link>
      </section>
    </>
  );
}

// ---------- Galeri ----------

export function GalleryView({ ctx }: { ctx: ClubCtx }) {
  const [open, setOpen] = useState<number | null>(null);
  const images = ctx.gallery;
  const current = open !== null ? images[open] : null;
  return (
    <>
      <MobileTopBar ctx={ctx} right={<LoginLink ctx={ctx} />} />
      <section className={`${page} flex flex-col gap-4 pt-5 md:gap-6 md:pt-12`}>
        <div className="flex items-baseline justify-between gap-3">
          <h1 className={pageTitle}>{ctx.labels.gallery}</h1>
          {images.length > 0 && <span className="text-sm font-semibold text-[#55585E]">{images.length} foto</span>}
        </div>
        {ctx.loadingGallery && images.length === 0 ? (
          <Skeleton rows={2} />
        ) : images.length === 0 ? (
          <EmptyCard title="Belum ada foto" body="Foto kegiatan klub akan tampil di sini." />
        ) : (
          <div className="columns-2 gap-2 md:columns-3 md:gap-3.5">
            {images.map((img, i) => (
              <figure key={img.id} className="mb-2 break-inside-avoid md:mb-3.5">
                <button type="button" onClick={() => setOpen(i)} className="block w-full overflow-hidden rounded-[18px] md:rounded-[24px]" aria-label={`Lihat foto ${img.caption || i + 1}`}>
                  <img src={img.url} alt={img.caption || `Foto ${ctx.community.name}`} loading="lazy" className="block h-auto w-full transition duration-500 hover:scale-[1.03]" />
                </button>
                {img.caption && <figcaption className="px-1.5 pt-1.5 text-xs text-[#55585E] md:text-sm">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </section>
      {current && (
        <div role="dialog" aria-modal="true" aria-label="Foto" className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-[#111214]/90 p-4" onClick={() => setOpen(null)}>
          <button type="button" aria-label="Tutup" onClick={() => setOpen(null)} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <img src={current.url} alt={current.caption || ""} className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
          {current.caption && <p className="max-w-xl text-center text-sm text-white">{current.caption}</p>}
        </div>
      )}
    </>
  );
}

// ---------- Kontak & FAQ ----------

export function ContactView({ ctx }: { ctx: ClubCtx }) {
  const c = ctx.community;
  const faq = clubFaq(c, ctx.packages);
  const [open, setOpen] = useState(0);
  return (
    <>
      <MobileTopBar ctx={ctx} right={<LoginLink ctx={ctx} />} />
      <section className={`${page} flex flex-col gap-10 pt-5 md:flex-row md:gap-10 md:pt-12`}>
        <div className="flex flex-col gap-4 md:flex-[1_1_340px]">
          <h1 className={pageTitle}>{ctx.labels.contact}</h1>
          <div className={`${card} flex flex-col gap-3.5 p-5`}>
            {c.contactInfo && <p className="whitespace-pre-line text-base leading-relaxed text-[#3A3C41]">{c.contactInfo}</p>}
            <WhatsAppButton ctx={ctx} className={`${btnDark} min-h-[54px] text-base`} label="Chat WhatsApp pengurus" />
            {!c.contactInfo && !c.whatsappNumber && <p className="text-[15px] text-[#55585E]">Info kontak belum diisi pengurus klub.</p>}
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-[2_1_560px]">
          <h2 className="text-[28px] font-black tracking-[-0.04em] md:pt-1 md:text-[40px]">Sering ditanya</h2>
          <div className={`${card} px-[18px] py-1 md:px-7`}>
            {faq.map((item, i) => (
              <div key={item.q} className={i < faq.length - 1 ? "border-b border-[#EEEEE8]" : ""}>
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left text-base font-bold md:min-h-[68px] md:text-lg"
                >
                  {item.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F1F1EC] text-lg font-semibold">{open === i ? "−" : "+"}</span>
                </button>
                {open === i && <p className="whitespace-pre-line pb-4 text-[15px] leading-relaxed text-[#55585E] md:text-base">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ---------- Lainnya (phones) ----------

export function MoreView({ ctx }: { ctx: ClubCtx }) {
  const c = ctx.community;
  const pages = [
    { label: ctx.labels.about, sub: "Profil klub & pesan pengurus", href: "/tentang" },
    { label: `${ctx.labels.contact} & FAQ`, sub: "Info kontak & pertanyaan umum", href: "/kontak" },
  ];
  return (
    <section className={`${page} flex flex-col gap-4 pt-5 md:max-w-[640px] md:pt-12`}>
      <div className="flex items-center gap-2.5">
        <ClubLogo community={c} size={44} />
        <span className="flex min-w-0 flex-col">
          <b className="truncate text-lg font-extrabold">{c.name}</b>
          {c.tagline && <span className="truncate text-[13px] text-[#55585E]">{c.tagline}</span>}
        </span>
      </div>
      <h1 className={pageTitle}>Lainnya</h1>
      <div className={`${card} px-4`}>
        {pages.map((p, i) => (
          <Link key={p.href} href={clubHref(ctx.base, p.href)} className={`flex min-h-16 items-center gap-3.5 ${i === 0 ? "border-b border-[#EEEEE8]" : ""}`}>
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="text-base">{p.label}</b>
              <span className="text-[13px] text-[#55585E]">{p.sub}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-[#8A8C91]" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <div className={`${card} flex flex-col px-4`}>
        <Link href={clubHref(ctx.base, ctx.isLoggedIn && ctx.status ? "/member" : "/login")} className="flex min-h-[60px] items-center gap-3.5 border-b border-[#EEEEE8]">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#F1F1EC]">
            <LogIn className="h-[19px] w-[19px]" aria-hidden="true" />
          </span>
          <b className="flex-1 text-base">{ctx.isLoggedIn && ctx.status ? "Buka halaman member" : "Masuk sebagai member"}</b>
        </Link>
        {!(ctx.isLoggedIn && ctx.status) && (
          <div className="border-b border-[#EEEEE8] py-2.5">
            {ctx.joinButton(`${btnClub} w-full`, ctx.labels.join, <span />)}
          </div>
        )}
        <button type="button" onClick={ctx.share} className="flex min-h-[60px] items-center gap-3.5 text-left">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#F1F1EC]">
            <Share2 className="h-[19px] w-[19px]" aria-hidden="true" />
          </span>
          <b className="flex-1 text-base">Bagikan halaman klub</b>
        </button>
      </div>
      <p className="text-center text-xs text-[#55585E]">
        {joinNote(ctx)} · {formatPerSession(ctx)}
      </p>
    </section>
  );
}

function formatPerSession(ctx: ClubCtx): string {
  const best = bestValuePackageId(ctx.packages);
  const p = ctx.packages.find((x) => x.id === best);
  return p ? `mulai ${rupiah(perSessionPrice(p))}/sesi` : `${ctx.packages.length} paket`;
}
