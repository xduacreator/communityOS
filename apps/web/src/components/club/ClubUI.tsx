/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  History,
  Home,
  Images,
  Menu,
  Ticket,
  UserRound,
} from "lucide-react";
import type { Community, SessionPackage } from "../../types";
import {
  bestValuePackageId,
  initials,
  packageNeedsMembership,
  packageSlotsLeft,
  perSessionPrice,
  rupiah,
} from "../../lib/club";
import { clubHref, type ClubCtx, type ClubView } from "./types";

export const card = "rounded-[24px] bg-white shadow-[0_1px_0_#E6E6E0]";
export const btnDark =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#111214] px-6 text-[15px] font-bold text-white transition hover:bg-[#2a2c30] disabled:opacity-50";
export const btnClub =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--club)] px-6 text-[15px] font-extrabold text-[var(--club-on)] transition hover:brightness-95 disabled:opacity-50";
export const btnLight =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-bold shadow-[inset_0_0_0_1px_#DDDDD6] transition hover:bg-[#FBFBF8]";
export const pageTitle = "text-[40px] font-black leading-[0.95] tracking-[-0.045em] md:text-[64px]";
export const sectionTitle = "text-[28px] font-black tracking-[-0.04em] md:text-[40px]";

export function ClubLogo({ community, size = 36 }: { community: Community; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--club)] font-extrabold text-[var(--club-on)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {community.logo ? <img src={community.logo} alt="" className="h-full w-full object-cover" /> : initials(community.name)}
    </span>
  );
}

// ---------- Navigation ----------

const PUBLIC_TABS = [
  { key: "home", path: "", icon: Home, label: (c: ClubCtx) => c.labels.home },
  { key: "packages", path: "/paket", icon: Ticket, label: () => "Paket" },
  { key: "events", path: "/event", icon: CalendarDays, label: (c: ClubCtx) => c.labels.events },
  { key: "gallery", path: "/galeri", icon: Images, label: (c: ClubCtx) => c.labels.gallery },
  { key: "more", path: "/lainnya", icon: Menu, label: () => "Lainnya" },
] as const;

const MEMBER_TABS = [
  { key: "member", path: "/member", icon: Home, label: "Beranda" },
  { key: "member-packages", path: "/member/paket", icon: Ticket, label: "Paket" },
  { key: "member-history", path: "/member/riwayat", icon: History, label: "Riwayat" },
  { key: "member-card", path: "/member/kartu", icon: CreditCard, label: "Kartu" },
  { key: "member-account", path: "/member/akun", icon: UserRound, label: "Akun" },
] as const;

function activePublicTab(view: ClubView): string {
  return view === "about" || view === "contact" ? "more" : view;
}

export function BottomTabs({ ctx, view }: { ctx: ClubCtx; view: ClubView }) {
  const member = view.startsWith("member");
  const active = member ? view : activePublicTab(view);
  const tabs = member
    ? MEMBER_TABS.map((t) => ({ key: t.key, path: t.path, icon: t.icon, label: t.label }))
    : PUBLIC_TABS.map((t) => ({ key: t.key, path: t.path, icon: t.icon, label: t.label(ctx) }));
  return (
    <nav
      aria-label={member ? "Menu member" : "Menu klub"}
      className="fixed inset-x-0 bottom-0 z-[90] grid grid-cols-5 border-t border-[#E6E6E0] bg-white/95 px-1.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:hidden"
    >
      {tabs.map((t) => {
        const on = t.key === active;
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={clubHref(ctx.base, t.path)}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${on ? "text-[var(--club-text)]" : "text-[#6B6E74]"}`}
          >
            <span className={`flex h-[30px] w-[54px] items-center justify-center rounded-full ${on ? "bg-[var(--club-soft)]" : ""}`}>
              <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span className="max-w-full truncate px-0.5">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopHeader({ ctx, view }: { ctx: ClubCtx; view: ClubView }) {
  const member = view.startsWith("member");
  const links = member
    ? MEMBER_TABS.map((t) => ({ key: t.key, path: t.path, label: t.label === "Paket" ? "Paket saya" : t.label }))
    : [
        { key: "home", path: "", label: ctx.labels.home },
        { key: "packages", path: "/paket", label: "Paket" },
        { key: "events", path: "/event", label: ctx.labels.events },
        { key: "about", path: "/tentang", label: ctx.labels.about },
        { key: "gallery", path: "/galeri", label: ctx.labels.gallery },
        { key: "contact", path: "/kontak", label: ctx.labels.contact },
      ];
  return (
    <header className="mx-auto hidden max-w-[1240px] items-center justify-between gap-4 px-8 py-5 md:flex">
      <Link href={clubHref(ctx.base, member ? "/member" : "")} className="flex min-w-0 items-center gap-2.5">
        <ClubLogo community={ctx.community} size={42} />
        <b className="truncate text-[21px] font-extrabold tracking-[-0.02em]">{ctx.community.name}</b>
      </Link>
      <nav aria-label={member ? "Menu member" : "Menu klub"} className="flex flex-wrap gap-0.5 text-[15px] font-semibold">
        {links.map((l) => {
          const on = l.key === view;
          return (
            <Link
              key={l.key}
              href={clubHref(ctx.base, l.path)}
              aria-current={on ? "page" : undefined}
              className={`rounded-full px-3.5 py-2.5 transition hover:bg-white ${on ? "bg-white shadow-[0_1px_0_#E6E6E0]" : ""}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-1.5">
        {member ? (
          <Link href={clubHref(ctx.base, "/member/akun")} className="flex min-h-12 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-extrabold shadow-[inset_0_0_0_1px_#E6E6E0]">
              {initials(ctx.currentUser?.name)}
            </span>
            <b className="max-w-[160px] truncate text-[15px]">{ctx.currentUser?.name}</b>
          </Link>
        ) : (
          <HeaderActions ctx={ctx} />
        )}
      </div>
    </header>
  );
}

function HeaderActions({ ctx }: { ctx: ClubCtx }) {
  if (ctx.isLoggedIn && ctx.status) {
    return (
      <Link href={clubHref(ctx.base, "/member")} className={`${btnDark} min-h-[46px] pl-5 pr-2`}>
        Halaman member
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--club)] text-[var(--club-on)]">
          <ChevronRight className="h-4 w-4" strokeWidth={2.8} aria-hidden="true" />
        </span>
      </Link>
    );
  }
  return (
    <>
      <Link href={clubHref(ctx.base, "/login")} className="inline-flex min-h-[46px] items-center px-4 text-[15px] font-bold">
        Masuk
      </Link>
      {ctx.joinButton(`${btnDark} min-h-[46px] pl-5 pr-2`, ctx.labels.join, <ArrowBubble />)}
    </>
  );
}

export function ArrowBubble({ size = 30 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-full bg-[var(--club)] text-[var(--club-on)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.47} height={size * 0.47} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </span>
  );
}

/** Small top bar for inner pages on phones */
export function MobileTopBar({ ctx, right }: { ctx: ClubCtx; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3 md:hidden">
      <Link href={clubHref(ctx.base)} className="flex min-w-0 items-center gap-2">
        <ClubLogo community={ctx.community} size={34} />
        <b className="truncate text-[15px] font-extrabold">{ctx.community.name}</b>
      </Link>
      {right}
    </div>
  );
}

export function LoginLink({ ctx, onDark = false }: { ctx: ClubCtx; onDark?: boolean }) {
  if (ctx.isLoggedIn && ctx.status) {
    return (
      <Link
        href={clubHref(ctx.base, "/member")}
        className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold ${onDark ? "bg-white/95 text-[#111214]" : ""}`}
      >
        Halaman member
      </Link>
    );
  }
  return (
    <Link
      href={clubHref(ctx.base, "/login")}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold ${onDark ? "bg-white/95 text-[#111214]" : ""}`}
    >
      Masuk
    </Link>
  );
}

export function ClubFooter({ ctx }: { ctx: ClubCtx }) {
  return (
    <footer className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3 px-4 pb-8 pt-10 text-[13px] text-[#55585E] md:px-8 md:text-sm">
      <span>
        © {new Date().getFullYear()} {ctx.community.name}
      </span>
      <span>
        Dikelola dengan <b className="text-[#111214]">latih.club</b>
      </span>
    </footer>
  );
}

// ---------- Packages ----------

export function PackageBadges({ ctx, pkg, best }: { ctx: ClubCtx; pkg: SessionPackage; best: boolean }) {
  const category = pkg.category?.name;
  return (
    <div className="flex min-h-[26px] flex-wrap gap-1.5">
      {best && (
        <span className="rounded-full bg-[var(--club-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--club-text)]">
          Paling hemat per sesi
        </span>
      )}
      {packageNeedsMembership(ctx.community, pkg) && (
        <span className="rounded-full bg-[#111214] px-2.5 py-1 text-xs font-bold text-white">Perlu membership</span>
      )}
      {category && (
        <span className="rounded-full bg-[#F1F1EC] px-2.5 py-1 text-xs font-bold">
          {[pkg.category?.activity?.name, category].filter(Boolean).join(" · ")}
        </span>
      )}
    </div>
  );
}

export function PackageCard({ ctx, pkg, best }: { ctx: ClubCtx; pkg: SessionPackage; best: boolean }) {
  const left = packageSlotsLeft(pkg);
  return (
    <article className={`${card} flex flex-col gap-4 p-5 md:p-6 ${best ? "ring-2 ring-[var(--club)]" : ""}`}>
      <PackageBadges ctx={ctx} pkg={pkg} best={best} />
      <div className="flex flex-col gap-1.5 md:min-h-[96px]">
        <h3 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] md:text-2xl">{pkg.name}</h3>
        {pkg.description && <p className="line-clamp-3 text-[15px] leading-relaxed text-[#55585E]">{pkg.description}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <b className="text-[32px] font-black leading-none tracking-[-0.04em] md:text-[36px]">{rupiah(pkg.memberPrice)}</b>
        <span className="text-[13px] font-semibold text-[#55585E]">
          {rupiah(perSessionPrice(pkg))} per sesi
          {pkg.vipPrice ? ` · private ${rupiah(pkg.vipPrice)}` : ""}
        </span>
      </div>
      <dl className="grid grid-cols-3 border-t border-[#EEEEE8] pt-3 text-xs font-semibold text-[#55585E]">
        <div>
          <dd className="text-base font-bold text-[#111214]">{pkg.totalSession} sesi</dd>
          <dt>per orang</dt>
        </div>
        <div>
          <dd className="text-base font-bold text-[#111214]">{pkg.validDays} hari</dd>
          <dt>masa berlaku</dt>
        </div>
        {left !== null && (
          <div>
            <dd className={`text-base font-bold ${left <= 5 ? "text-[#B54708]" : "text-[#111214]"}`}>
              {left === 0 ? "Penuh" : `${left} slot`}
            </dd>
            <dt>{left === 0 ? "waiting list" : "tersisa"}</dt>
          </div>
        )}
      </dl>
      <div className="mt-auto flex gap-2">
        <button type="button" onClick={() => ctx.showPackageDetail(pkg)} className={`${btnLight} flex-1 px-4`}>
          Detail
        </button>
        <button
          type="button"
          onClick={() => ctx.choosePackage(pkg)}
          disabled={ctx.purchasing[pkg.id]}
          className={`${best ? btnClub : btnDark} flex-[1.4] px-4`}
        >
          {ctx.purchasing[pkg.id] ? "Memproses…" : "Pilih"}
        </button>
      </div>
    </article>
  );
}

export function PackageGrid({ ctx, packages }: { ctx: ClubCtx; packages: SessionPackage[] }) {
  const best = bestValuePackageId(ctx.packages);
  if (ctx.loadingPackages && packages.length === 0) return <Skeleton rows={2} />;
  if (packages.length === 0) {
    return <EmptyCard title="Belum ada paket" body="Paket latihan dari klub akan muncul di sini." />;
  }
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {packages.map((p) => (
        <PackageCard key={p.id} ctx={ctx} pkg={p} best={p.id === best} />
      ))}
    </div>
  );
}

// ---------- Small pieces ----------

export function EmptyCard({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className={`${card} flex flex-col items-center gap-2 px-5 py-8 text-center`}>
      <b className="text-lg">{title}</b>
      <p className="max-w-sm text-sm leading-relaxed text-[#55585E]">{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-[24px] bg-[#EAEAE3]" />
      ))}
    </div>
  );
}

export function StatsRow({ ctx, variant = "card" }: { ctx: ClubCtx; variant?: "card" | "plain" }) {
  const c = ctx.community;
  const stats = [
    { v: c.statMembersValue, l: "Member" },
    { v: c.statEventsValue, l: "Kegiatan" },
    { v: c.statCitiesValue, l: "Kota" },
    { v: c.statAchievementsValue, l: "Prestasi" },
  ].filter((s) => s.v && String(s.v).trim() !== "");
  if (stats.length === 0) return null;
  if (variant === "plain") {
    return (
      <div className="flex max-w-[520px] flex-wrap gap-y-3 pt-1.5">
        {stats.map((s, i) => (
          <span key={s.l} className={`flex flex-col gap-0.5 pr-5 ${i > 0 ? "border-l border-[#DDDDD6] pl-5" : ""}`}>
            <b className="text-[34px] font-black leading-none tracking-[-0.035em]">{s.v}</b>
            <span className="text-sm font-semibold text-[#55585E]">{s.l}</span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={`${card} grid px-1 py-3.5`} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((s, i) => (
        <span key={s.l} className={`flex flex-col items-center gap-0.5 ${i > 0 ? "border-l border-[#EEEEE8]" : ""}`}>
          <b className="text-2xl font-black leading-tight tracking-[-0.03em]">{s.v}</b>
          <span className="text-xs font-semibold text-[#55585E]">{s.l}</span>
        </span>
      ))}
    </div>
  );
}

export function SectionHead({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className={sectionTitle}>{title}</h2>
      {href && (
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-[var(--club-text)] md:text-base">
          {linkLabel || "Semua"} →
        </Link>
      )}
    </div>
  );
}
