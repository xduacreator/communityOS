"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Clock, Download, Home, LogOut, MessageCircle, Plus, Snowflake, Upload } from "lucide-react";
import type { UserMembershipWithMembership } from "../../types";
import { getApiUrl } from "../../lib/api";
import { getAuthHeaders } from "../../lib/auth";
import { daysUntil, formatDate, initials, rupiah, whatsappLink } from "../../lib/club";
import { ClubLogo, EmptyCard, Skeleton, btnClub, btnDark, btnLight, card } from "./ClubUI";
import { clubHref, type ActiveWalletView, type ClubCtx, type HistoryItem } from "./types";

const page = "mx-auto w-full max-w-[1240px] px-4 md:px-8";
const title = "text-[40px] font-black leading-[0.95] tracking-[-0.045em] md:text-[64px]";
const PENDING = ["PENDING", "WAITING", "WAITLIST"];

export function checkedInToday(wallet: ActiveWalletView, history: HistoryItem[]): boolean {
  const latest = history.find((h) => h.walletKey === wallet.walletKey);
  return Boolean(latest && latest.type === "ATTENDANCE" && latest.change < 0 && latest.date.toDateString() === new Date().toDateString());
}

function walletOwner(w: ActiveWalletView, ctx: ClubCtx): string {
  return w.participantName || `${ctx.currentUser?.name || "Saya"} (kamu)`;
}

function activeWallets(ctx: ClubCtx) {
  return ctx.wallets.filter((w) => w.status === "ACTIVE" && w.remainingSession > 0);
}

interface MembershipState {
  current: UserMembershipWithMembership | null;
  label: string;
  tone: "ok" | "warn" | "bad" | "none";
  detail: string;
}

export function membershipState(ctx: ClubCtx): MembershipState {
  const list = ctx.memberships;
  if (!list || list.length === 0) {
    return ctx.community.registrationMode === "FREE"
      ? { current: null, label: "Member gratis", tone: "none", detail: "Belum punya membership berbayar" }
      : { current: null, label: "Belum ada membership", tone: "bad", detail: "Pilih membership untuk mulai" };
  }
  const now = new Date();
  const current =
    list.find((m) => m.status === "ACTIVE" && new Date(m.endDate) >= now) || list.find((m) => m.status === "ACTIVE") || list[0];
  const expired = current.status === "ACTIVE" && new Date(current.endDate) < now;
  if (expired) return { current, label: "Membership berakhir", tone: "bad", detail: `Berakhir ${formatDate(current.endDate)}` };
  if (current.status !== "ACTIVE") return { current, label: "Menunggu konfirmasi", tone: "warn", detail: "Pembayaran membership sedang dicek" };
  const left = daysUntil(current.endDate) ?? 0;
  return {
    current,
    label: `${left} hari lagi`,
    tone: left <= 7 ? "warn" : "ok",
    detail: `Aktif s.d. ${formatDate(current.endDate)}`,
  };
}

const toneClass = {
  ok: "bg-[#D6FBEF] text-[#0B6B53]",
  warn: "bg-[#FFF0A6] text-[#111214]",
  bad: "bg-[#FEE4E2] text-[#912018]",
  none: "bg-[#F1F1EC] text-[#111214]",
};

// ---------- Gate: login / membership status ----------

function MemberGate({ ctx }: { ctx: ClubCtx }) {
  const s = ctx.status;
  if (!ctx.authChecked) return <Skeleton rows={2} />;
  if (!ctx.isLoggedIn) {
    return (
      <EmptyCard
        title="Masuk dulu, yuk"
        body={`Halaman ini berisi paket, check-in, dan kartu member kamu di ${ctx.community.name}.`}
        action={
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link href={clubHref(ctx.base, "/login")} className={btnDark}>
              Masuk
            </Link>
            {ctx.joinButton(btnLight, ctx.labels.join, <span />)}
          </div>
        }
      />
    );
  }
  if (!s) {
    return (
      <EmptyCard
        title="Kamu belum terdaftar di klub ini"
        body={`Gabung ${ctx.community.name} dulu untuk membeli paket dan check-in.`}
        action={<div className="mt-2">{ctx.joinButton(btnClub, ctx.labels.join, <span />)}</div>}
      />
    );
  }
  return <RegistrationStatus ctx={ctx} />;
}

function RegistrationStatus({ ctx }: { ctx: ClubCtx }) {
  const s = ctx.status!;
  const c = ctx.community;
  const rejected = s.status === "REJECTED";
  const [uploading, setUploading] = useState(false);
  const wa = whatsappLink(c.whatsappNumber, `Halo pengurus ${c.name}, saya mau tanya soal pendaftaran member.`);
  return (
    <div role="status" className={`${card} flex flex-col gap-3 p-5 md:max-w-2xl md:p-8`}>
      <span className={`self-start rounded-full px-3 py-1.5 text-[13px] font-extrabold ${rejected ? toneClass.bad : toneClass.warn}`}>
        {rejected ? "Pendaftaran ditolak" : "Menunggu persetujuan"}
      </span>
      <b className="text-xl leading-snug md:text-2xl">
        {rejected ? "Pendaftaranmu belum bisa disetujui." : "Pendaftaranmu sedang dicek pengurus klub."}
      </b>
      <p className="text-[15px] leading-relaxed text-[#55585E]">
        {rejected
          ? "Hubungi pengurus klub untuk info lebih lanjut, atau unggah ulang bukti pembayaran yang benar."
          : c.registrationMode === "PAID"
            ? "Selesaikan pembayaran membership lalu unggah buktinya. Setelah disetujui, kamu bisa membeli paket dan check-in."
            : "Setelah disetujui, kamu bisa membeli paket dan check-in. Biasanya tidak lama."}
      </p>
      {c.registrationMode === "PAID" && (
        <div className="flex flex-col gap-3 border-t border-[#EEEEE8] pt-4">
          {c.qrisImageUrl && <img src={c.qrisImageUrl} alt="QRIS pembayaran" className="w-48 rounded-xl border border-[#E6E6E0] bg-white p-2" />}
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#3A3C41]">
            {c.paymentInstructions || "Hubungi pengurus untuk instruksi pembayaran."}
          </p>
          {s.paymentProofUrl && !rejected ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#D6FBEF] p-4 text-sm font-bold text-[#0B6B53]">
              <Check className="h-5 w-5" aria-hidden="true" />
              Bukti transfer terkirim, menunggu verifikasi.
              <a href={s.paymentProofUrl} target="_blank" rel="noreferrer" className="underline">
                Lihat bukti
              </a>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-[#CFCFC8] p-5 text-center">
              <Upload className="h-6 w-6 text-[var(--club-text)]" aria-hidden="true" />
              <b className="text-sm text-[var(--club-text)]">{uploading ? "Mengunggah…" : "Unggah foto bukti transfer"}</b>
              <span className="text-xs text-[#55585E]">JPG, PNG, atau WEBP</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  await ctx.uploadRegistrationProof(file);
                  setUploading(false);
                }}
              />
            </label>
          )}
        </div>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`${rejected ? btnDark : btnLight} mt-1`}>
          <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
          Tanya pengurus
        </a>
      )}
    </div>
  );
}

function isApproved(ctx: ClubCtx): boolean {
  return Boolean(ctx.isLoggedIn && ctx.status && (ctx.status.status === "APPROVED" || ctx.status.role === "COMMUNITY_ADMIN"));
}

function MemberTopBar({ ctx }: { ctx: ClubCtx }) {
  return (
    <div className="flex items-center justify-between px-3.5 pb-1 pt-3 md:hidden">
      <span className="flex min-w-0 items-center gap-2">
        <ClubLogo community={ctx.community} size={34} />
        <b className="truncate text-[15px] font-extrabold">{ctx.community.name}</b>
      </span>
      <Link
        href={clubHref(ctx.base, "/member/akun")}
        aria-label="Akun"
        className="flex h-11 w-11 items-center justify-center"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[13px] font-extrabold shadow-[inset_0_0_0_1px_#E6E6E0]">
          {initials(ctx.currentUser?.name)}
        </span>
      </Link>
    </div>
  );
}

function Shell({ ctx, heading, children, allowPending = false }: { ctx: ClubCtx; heading?: string; children: React.ReactNode; allowPending?: boolean }) {
  const ok = isApproved(ctx) || (allowPending && ctx.isLoggedIn);
  return (
    <>
      <MemberTopBar ctx={ctx} />
      <section className={`${page} flex flex-col gap-4 pt-2 md:gap-6 md:pt-6`}>
        {heading && <h1 className={title}>{heading}</h1>}
        {ok ? children : ctx.loadingDashboard && !ctx.status ? <Skeleton rows={2} /> : <MemberGate ctx={ctx} />}
      </section>
    </>
  );
}

// ---------- Beranda member ----------

export function MemberHomeView({ ctx }: { ctx: ClubCtx }) {
  const first = (ctx.currentUser?.name || "").split(" ")[0];
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const active = activeWallets(ctx);
  const pending = ctx.wallets.filter((w) => PENDING.includes(w.status));
  const mem = membershipState(ctx);
  const showMembership = (ctx.community.memberships || []).length > 0 || ctx.memberships.length > 0;
  const recent = ctx.history.slice(0, 4);
  const main = active[0];

  return (
    <Shell ctx={ctx}>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[#55585E] first-letter:uppercase md:text-base">{today}</span>
        <h1 className={title}>
          Halo{first ? `, ${first}` : ""}
          <span className="text-[var(--club)]">.</span>
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        <div className="flex flex-col gap-4 md:col-span-8">
          {pending.length > 0 && (
            <Link href={clubHref(ctx.base, "/member/paket")} className={`${card} flex items-center gap-3 px-4 py-3.5`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#F5B400]" />
              <span className="flex min-w-0 flex-1 flex-col">
                <b className="text-[15px]">
                  {pending.some((w) => w.status !== "PENDING") ? "Pesanan di waiting list" : "Pembayaran sedang dicek"}
                </b>
                <span className="truncate text-[13px] text-[#55585E]">
                  {pending[0].packageName}
                  {pending.length > 1 ? ` · ${pending.length} peserta` : ""}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#8A8C91]" strokeWidth={2.4} aria-hidden="true" />
            </Link>
          )}

          {main ? (
            <SessionHero ctx={ctx} wallet={main} />
          ) : (
            <EmptyCard
              title="Belum ada paket aktif"
              body="Pilih paket latihan untuk mulai check-in di setiap sesi."
              action={
                <Link href={clubHref(ctx.base, "/paket")} className={`${btnDark} mt-1`}>
                  Lihat paket
                </Link>
              }
            />
          )}

          {showMembership && (
            <div className="md:hidden">
              <MembershipCard ctx={ctx} state={mem} compact />
            </div>
          )}

          {active.length > 1 && (
            <div className={`${card} px-4 py-1`}>
              {active.slice(1).map((w, i, arr) => (
                <WalletRow key={w.walletKey} ctx={ctx} wallet={w} last={i === arr.length - 1} />
              ))}
            </div>
          )}

          <section aria-label="Aktivitas terakhir" className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[26px] font-black tracking-[-0.04em] md:text-4xl">Aktivitas</h2>
              <Link href={clubHref(ctx.base, "/member/riwayat")} className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--club-text)] md:text-[15px]">
                Semua →
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyCard title="Belum ada aktivitas" body="Pembelian dan check-in kamu akan tercatat di sini." />
            ) : (
              <div className={`${card} px-4 py-0.5 md:px-6`}>
                {recent.map((h, i) => (
                  <HistoryRow key={i} item={h} last={i === recent.length - 1} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="hidden flex-col gap-4 md:col-span-4 md:flex">
          {showMembership && <MembershipCard ctx={ctx} state={mem} compact />}
          <MemberCardFace ctx={ctx} small />
        </aside>
      </div>
    </Shell>
  );
}

function SessionHero({ ctx, wallet }: { ctx: ClubCtx; wallet: ActiveWalletView }) {
  const used = Math.max(0, wallet.totalSession - wallet.remainingSession);
  const left = daysUntil(wallet.expiredDate);
  const done = checkedInToday(wallet, ctx.history);
  const segments = wallet.totalSession <= 24;
  return (
    <section aria-label="Sesi aktif" className="flex flex-col gap-4 rounded-[30px] bg-[#111214] p-[22px] text-white md:flex-row md:items-center md:gap-8 md:rounded-[34px] md:p-8">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold text-[#BEC0C5] md:text-[15px]">Paket aktif · {walletOwner(wallet, ctx)}</span>
            <b className="truncate text-xl md:text-[26px]">{wallet.packageName}</b>
          </span>
          {left !== null && <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold">{left} hari lagi</span>}
        </div>
        <div className="flex items-baseline gap-2.5">
          <b className="text-[88px] font-black leading-[0.85] tracking-[-0.06em] md:text-[112px]">{wallet.remainingSession}</b>
          <span className="text-[17px] font-semibold text-[#D4D5D9] md:text-xl">dari {wallet.totalSession} sesi tersisa</span>
        </div>
        {segments ? (
          <div className="grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${wallet.totalSession}, minmax(0, 1fr))` }} role="img" aria-label={`${used} sesi terpakai, ${wallet.remainingSession} tersisa`}>
            {Array.from({ length: wallet.totalSession }).map((_, i) => (
              <span key={i} className={`h-2 rounded-full ${i < used ? "bg-white/20" : "bg-[var(--club)]"}`} />
            ))}
          </div>
        ) : (
          <div className="h-2 overflow-hidden rounded-full bg-white/20" role="img" aria-label={`${wallet.remainingSession} dari ${wallet.totalSession} sesi tersisa`}>
            <div className="h-2 rounded-full bg-[var(--club)]" style={{ width: `${(wallet.remainingSession / wallet.totalSession) * 100}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5 md:w-[260px]">
        {wallet.expiredDate && (
          <span className="text-center text-[13px] text-[#BEC0C5] md:order-first md:flex md:justify-between md:text-[15px]">
            <span className="hidden md:inline">Berlaku s.d.</span>
            <b className="font-normal md:font-bold md:text-white">
              <span className="md:hidden">Berlaku s.d. </span>
              {formatDate(wallet.expiredDate)}
            </b>
          </span>
        )}
        <button
          type="button"
          onClick={() => ctx.openCheckin(wallet.walletKey)}
          className={`${btnClub} min-h-14 text-[17px] md:order-last`}
        >
          <Check className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
          {done ? "Sudah check-in · check-out" : "Check-in hari ini"}
        </button>
      </div>
    </section>
  );
}

function WalletRow({ ctx, wallet, last }: { ctx: ClubCtx; wallet: ActiveWalletView; last: boolean }) {
  const pct = wallet.totalSession > 0 ? (wallet.remainingSession / wallet.totalSession) * 100 : 0;
  return (
    <div className={`flex items-center gap-3 py-3.5 ${last ? "" : "border-b border-[#EEEEE8]"}`}>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex justify-between gap-2">
          <b className="truncate text-[15px]">
            {wallet.packageName} · {walletOwner(wallet, ctx)}
          </b>
          <b className="shrink-0 text-[15px]">
            {wallet.remainingSession}/{wallet.totalSession}
          </b>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-[#EEEEE8]">
          <span className="block h-1.5 rounded-full bg-[var(--club)]" style={{ width: `${pct}%` }} />
        </span>
      </span>
      <button type="button" onClick={() => ctx.openCheckin(wallet.walletKey)} className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-[#111214] px-4 text-[13px] font-bold text-white">
        Check-in
      </button>
    </div>
  );
}

function MembershipCard({ ctx, state, compact = false }: { ctx: ClubCtx; state: MembershipState; compact?: boolean }) {
  const canBuy = (ctx.community.memberships || []).length > 0;
  const name = state.current?.membership?.name || "Membership";
  if (compact) {
    return (
      <section aria-label="Membership" className={`${card} flex items-center gap-3 p-4 md:flex-col md:items-stretch md:gap-2.5 md:p-[22px]`}>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center justify-between gap-2">
            <b className="truncate text-base md:text-lg">{state.current ? name : state.label}</b>
            <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold md:inline ${toneClass[state.tone]}`}>{state.current ? state.label : "Gratis"}</span>
          </span>
          <span className={`text-[13px] font-bold md:text-sm md:font-normal md:text-[#55585E] ${state.tone === "warn" ? "text-[#B54708]" : state.tone === "bad" ? "text-[#B42318]" : "text-[#55585E]"}`}>
            {state.current ? `${state.detail}` : state.detail}
            <span className="md:hidden">{state.current && state.tone !== "bad" ? ` · ${state.label}` : ""}</span>
          </span>
        </span>
        {canBuy && (
          <button type="button" onClick={ctx.openRenewal} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#111214] px-[18px] text-sm font-bold text-white md:min-h-12 md:text-[15px]">
            {state.current ? "Perpanjang" : "Beli membership"}
          </button>
        )}
      </section>
    );
  }
  return (
    <section aria-label="Membership" className="flex flex-col gap-3 rounded-[26px] bg-[#111214] p-5 text-white">
      <div className="flex items-start justify-between gap-2.5">
        <span className="flex flex-col gap-0.5">
          <b className="text-[19px]">{state.current ? name : state.label}</b>
          <span className="text-sm text-[#D4D5D9]">{state.current?.membership ? `${state.current.membership.durationDays} hari per periode` : state.detail}</span>
        </span>
        {state.current && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${toneClass[state.tone]}`}>{state.label}</span>}
      </div>
      {state.current && <span className="text-sm text-[#D4D5D9]">{state.detail}</span>}
      {canBuy && (
        <>
          <button type="button" onClick={ctx.openRenewal} className={`${btnClub} min-h-[50px]`}>
            {state.current ? "Perpanjang" : "Beli membership"}
            {ctx.community.memberships?.[0] ? ` · ${rupiah(ctx.community.memberships[0].price)}` : ""}
          </button>
          <span className="text-center text-xs text-[#BEC0C5]">Punya kode voucher? Masukkan saat checkout.</span>
        </>
      )}
    </section>
  );
}

// ---------- Paket saya ----------

export function MemberPackagesView({ ctx }: { ctx: ClubCtx }) {
  const [seg, setSeg] = useState<"active" | "wait" | "done">("active");
  const active = ctx.wallets.filter((w) => w.status === "ACTIVE");
  const wait = ctx.wallets.filter((w) => PENDING.includes(w.status));
  const done = ctx.wallets.filter((w) => w.status === "COMPLETED");
  const list = seg === "active" ? active : seg === "wait" ? wait : done;
  const mem = membershipState(ctx);
  const others = useMemo(() => [...ctx.packages].sort((a, b) => (a.memberPrice || 0) - (b.memberPrice || 0)).slice(0, 4), [ctx.packages]);

  return (
    <Shell ctx={ctx} heading="Paket saya">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-5">
        <div className="flex flex-col gap-4 md:col-span-7">
          <div role="group" aria-label="Status paket" className="grid grid-cols-3 gap-1 rounded-full bg-[#EAEAE3] p-1">
            {(
              [
                ["active", `Aktif${active.length ? ` ${active.length}` : ""}`],
                ["wait", `Menunggu${wait.length ? ` ${wait.length}` : ""}`],
                ["done", "Selesai"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={seg === k}
                onClick={() => setSeg(k)}
                className={`min-h-10 rounded-full text-sm font-bold ${seg === k ? "bg-white shadow-[0_1px_2px_rgba(17,18,20,0.12)]" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <EmptyCard
              title={seg === "active" ? "Belum ada paket aktif" : seg === "wait" ? "Tidak ada pesanan menunggu" : "Belum ada paket selesai"}
              body={
                seg === "done"
                  ? "Paket yang sesinya habis atau masa berlakunya lewat akan muncul di sini."
                  : "Pesanan yang menunggu konfirmasi pembayaran akan muncul di sini."
              }
            />
          ) : (
            list.map((w) => <WalletCard key={w.walletKey} ctx={ctx} wallet={w} />)
          )}
        </div>
        <div className="flex flex-col gap-4 md:col-span-5">
          {((ctx.community.memberships || []).length > 0 || ctx.memberships.length > 0) && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-[26px] font-black tracking-[-0.04em]">Membership</h2>
              <MembershipCard ctx={ctx} state={mem} />
            </div>
          )}
          {others.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[26px] font-black tracking-[-0.04em]">Beli paket lagi</h2>
                <Link href={clubHref(ctx.base, "/paket")} className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--club-text)]">
                  Semua →
                </Link>
              </div>
              <div className={`${card} px-4 py-0.5`}>
                {others.map((p, i) => (
                  <Link key={p.id} href={clubHref(ctx.base, "/paket")} className={`flex items-center gap-3 py-3.5 ${i < others.length - 1 ? "border-b border-[#EEEEE8]" : ""}`}>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <b className="truncate text-[15px]">{p.name}</b>
                      <span className="text-[13px] text-[#55585E]">
                        {p.totalSession} sesi · {p.validDays} hari
                      </span>
                    </span>
                    <b className="text-[15px]">{rupiah(p.memberPrice)}</b>
                    <ChevronRight className="h-4 w-4 text-[#8A8C91]" strokeWidth={2.4} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function WalletCard({ ctx, wallet }: { ctx: ClubCtx; wallet: ActiveWalletView }) {
  const status =
    wallet.status === "ACTIVE"
      ? { t: wallet.remainingSession > 0 ? "Aktif" : "Sesi habis", c: wallet.remainingSession > 0 ? toneClass.ok : toneClass.none }
      : wallet.status === "COMPLETED"
        ? { t: "Selesai", c: toneClass.none }
        : wallet.status === "PENDING"
          ? { t: "Dicek pengurus", c: toneClass.warn }
          : { t: "Waiting list", c: toneClass.warn };
  const pct = wallet.totalSession > 0 ? (wallet.remainingSession / wallet.totalSession) * 100 : 0;
  return (
    <article className={`${card} flex flex-col gap-3.5 p-5`}>
      <div className="flex items-start justify-between gap-2.5">
        <span className="flex min-w-0 flex-col gap-0.5">
          <b className="text-xl">{wallet.packageName}</b>
          <span className="text-sm text-[#55585E]">Peserta: {walletOwner(wallet, ctx)}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${status.c}`}>{status.t}</span>
      </div>
      {wallet.status === "ACTIVE" || wallet.status === "COMPLETED" ? (
        <>
          <div className="flex items-baseline gap-2">
            <b className="text-[44px] font-black leading-none tracking-[-0.04em]">{wallet.remainingSession}</b>
            <span className="text-[15px] font-semibold text-[#55585E]">dari {wallet.totalSession} sesi tersisa</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EEEEE8]">
            <div className="h-2 rounded-full bg-[var(--club)]" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-sm text-[#55585E]">
            {wallet.purchaseDate && <span>Dibeli {formatDate(wallet.purchaseDate)}</span>}
            {wallet.expiredDate && (
              <span>
                Berlaku s.d. <b className="text-[#111214]">{formatDate(wallet.expiredDate)}</b>
              </span>
            )}
          </div>
          {wallet.status === "ACTIVE" && wallet.remainingSession > 0 && (
            <button type="button" onClick={() => ctx.openCheckin(wallet.walletKey)} className={`${btnDark} min-h-[50px]`}>
              Check-in
            </button>
          )}
        </>
      ) : (
        <p className="border-t border-[#EEEEE8] pt-3 text-[13px] leading-relaxed text-[#55585E]">
          {wallet.status === "PENDING"
            ? "Bukti pembayaran sudah dikirim. Sesi aktif setelah dikonfirmasi pengurus."
            : "Kuota paket sedang penuh. Kamu akan diaktifkan saat ada slot kosong."}
        </p>
      )}
    </article>
  );
}

// ---------- Riwayat ----------

function historyLabel(h: HistoryItem): { title: string; icon: "in" | "out" | "buy" | "freeze" | "other" } {
  if (h.type === "ATTENDANCE") {
    if (h.change < 0) return { title: "Check-in", icon: "in" };
    return h.change === 0 ? { title: "Check-out", icon: "out" } : { title: "Sesi dikembalikan", icon: "out" };
  }
  if (h.type === "PURCHASE") return { title: "Beli paket", icon: "buy" };
  if (h.type === "FREEZE") return { title: "Paket dibekukan", icon: "freeze" };
  return { title: "Perubahan sesi", icon: "other" };
}

function HistoryRow({ item, last }: { item: HistoryItem; last: boolean }) {
  const l = historyLabel(item);
  const styles = {
    in: "bg-[#D6FBEF] text-[#0B6B53]",
    out: "bg-[#F1F1EC] text-[#55585E]",
    buy: "bg-[#FFF0A6] text-[#111214]",
    freeze: "bg-[#DCEBFF] text-[#23364F]",
    other: "bg-[#F1F1EC] text-[#111214]",
  }[l.icon];
  const Icon = l.icon === "in" ? Check : l.icon === "buy" ? Plus : l.icon === "freeze" ? Snowflake : Clock;
  return (
    <div className={`flex items-center gap-3 py-3 ${last ? "" : "border-b border-[#EEEEE8]"}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${styles}`}>
        <Icon className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <b className="truncate text-[15px]">{l.title}</b>
        <span className="truncate text-[13px] text-[#55585E]">
          {item.remarks} · {formatDate(item.date, { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </span>
      {item.change !== 0 && <b className="shrink-0 text-[15px] text-[#55585E]">{item.change > 0 ? `+${item.change}` : item.change}</b>}
    </div>
  );
}

export function MemberHistoryView({ ctx }: { ctx: ClubCtx }) {
  const [filter, setFilter] = useState("all");
  const hasFreeze = ctx.history.some((h) => h.type === "FREEZE");
  const chips = [
    ["all", "Semua"],
    ["ATTENDANCE", "Check-in"],
    ["PURCHASE", "Pembelian"],
    ...(hasFreeze ? [["FREEZE", "Freeze"]] : []),
  ];
  const items = ctx.history.filter((h) => filter === "all" || h.type === filter);
  const groups: { month: string; items: HistoryItem[] }[] = [];
  items.forEach((h) => {
    const month = h.date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    let g = groups.find((x) => x.month === month);
    if (!g) {
      g = { month, items: [] };
      groups.push(g);
    }
    g.items.push(h);
  });
  const monthAgo = Date.now() - 30 * 86400000;
  const checkins = ctx.history.filter((h) => h.type === "ATTENDANCE" && h.change < 0);
  const recentCount = checkins.filter((h) => h.date.getTime() >= monthAgo).length;
  const lastCheckin = checkins[0];

  return (
    <Shell ctx={ctx} heading="Riwayat">
      <div className="grid grid-cols-2 gap-2.5 md:max-w-xl">
        <div className={`${card} p-4`}>
          <b className="block text-[32px] font-black leading-none tracking-[-0.04em]">{recentCount}×</b>
          <span className="text-[13px] font-semibold text-[#55585E]">check-in 30 hari terakhir</span>
        </div>
        <div className={`${card} p-4`}>
          <b className="block text-[32px] font-black leading-none tracking-[-0.04em]">
            {lastCheckin ? lastCheckin.date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "–"}
          </b>
          <span className="text-[13px] font-semibold text-[#55585E]">terakhir latihan</span>
        </div>
      </div>
      <div role="group" aria-label="Filter riwayat" className="flex gap-1.5 overflow-x-auto">
        {chips.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${filter === k ? "bg-[#111214] text-white" : "bg-white shadow-[inset_0_0_0_1px_#E6E6E0]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        <EmptyCard title="Belum ada riwayat" body="Pembelian dan check-in kamu akan tercatat di sini." />
      ) : (
        <div className="flex flex-col gap-4 md:max-w-3xl">
          {groups.map((g) => (
            <div key={g.month} className="flex flex-col gap-2">
              <span className="px-1 text-[13px] font-bold capitalize text-[#55585E]">{g.month}</span>
              <div className={`${card} px-4 py-0.5`}>
                {g.items.map((h, i) => (
                  <HistoryRow key={i} item={h} last={i === g.items.length - 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

// ---------- Kartu ----------

function MemberCardFace({ ctx, small = false }: { ctx: ClubCtx; small?: boolean }) {
  const c = ctx.community;
  const s = ctx.status;
  return (
    <section
      id={small ? undefined : "member-card"}
      aria-label="Kartu member digital"
      className={`relative flex flex-col overflow-hidden bg-[var(--club)] text-[var(--club-on)] ${small ? "gap-4 rounded-[26px] p-[22px]" : "gap-6 rounded-[30px] p-6 shadow-[0_30px_60px_-30px_rgba(17,18,20,0.55)]"}`}
    >
      {!small && c.logo && (
        <div
          id="member-card-bg"
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${c.logo})` }}
        />
      )}
      <div className="relative flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2.5">
          {!small && (
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--club-on)] text-sm font-extrabold text-[var(--club)]">
              {c.logo ? <img src={c.logo} alt="" className="h-full w-full object-cover" /> : initials(c.name)}
            </span>
          )}
          <b className={`truncate font-extrabold ${small ? "text-xs tracking-[0.1em]" : "text-[17px]"}`}>{small ? "KARTU MEMBER" : c.name}</b>
        </span>
        <span className="shrink-0 rounded-full bg-[var(--club-on)] px-3 py-1 text-xs font-extrabold text-[var(--club)]">
          {s?.status === "APPROVED" ? "Aktif" : s?.status === "PENDING" ? "Menunggu" : "–"}
        </span>
      </div>
      {!small && (
        <div className="relative flex flex-col gap-1">
          <span className="text-xs font-bold tracking-[0.1em]">ID MEMBER</span>
          <b className="text-[30px] font-black leading-none tracking-[0.02em]">{s?.membershipNumber || "—"}</b>
        </div>
      )}
      <div className="relative flex items-end justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          {small && <b className="text-2xl font-black leading-none">{s?.membershipNumber || "—"}</b>}
          <b className={small ? "truncate text-sm font-semibold" : "truncate text-xl"}>{ctx.currentUser?.name}</b>
          {!small && s?.createdAt && <span className="text-[13px] font-semibold">Member sejak {formatDate(s.createdAt)}</span>}
        </span>
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-2xl bg-white font-black text-[#111214] ${small ? "h-16 w-16 text-xl" : "h-[84px] w-[84px] text-[28px]"}`}
        >
          {initials(ctx.currentUser?.name)}
        </span>
      </div>
    </section>
  );
}

export function MemberCardView({ ctx }: { ctx: ClubCtx }) {
  const mem = membershipState(ctx);
  const active = activeWallets(ctx);
  return (
    <Shell ctx={ctx} heading="Kartu member">
      <div className="flex flex-col gap-4 md:max-w-[460px]">
        <MemberCardFace ctx={ctx} />
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={ctx.downloadCard} className={btnDark}>
            <Download className="h-[18px] w-[18px]" aria-hidden="true" />
            Unduh kartu
          </button>
          <button type="button" onClick={ctx.share} className={btnLight}>
            Bagikan klub
          </button>
        </div>
        <dl className={`${card} px-4 py-0.5`}>
          <div className="flex justify-between gap-3 border-b border-[#EEEEE8] py-3 text-[15px]">
            <dt className="text-[#55585E]">Membership</dt>
            <dd className="text-right font-bold">{mem.current ? `${mem.current.membership?.name || "Aktif"} · ${mem.label}` : mem.label}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-[#EEEEE8] py-3 text-[15px]">
            <dt className="text-[#55585E]">Paket aktif</dt>
            <dd className="text-right font-bold">
              {active.length === 0 ? "–" : active.length === 1 ? `${active[0].packageName} · ${active[0].remainingSession} sesi` : `${active.length} paket`}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-3 text-[15px]">
            <dt className="text-[#55585E]">Email</dt>
            <dd className="min-w-0 truncate text-right font-bold">{ctx.currentUser?.email}</dd>
          </div>
        </dl>
        <p className="text-center text-[13px] text-[#55585E]">Tunjukkan kartu ini ke pengurus bila diminta saat sesi.</p>
      </div>
    </Shell>
  );
}

// ---------- Akun ----------

export function MemberAccountView({ ctx }: { ctx: ClubCtx }) {
  const c = ctx.community;
  const wa = whatsappLink(c.whatsappNumber, `Halo pengurus ${c.name}.`);
  const answers = useMemo(() => {
    try {
      const fields: { id: string; label: string }[] = c.registrationFields ? JSON.parse(c.registrationFields) : [];
      const data: Record<string, string> = ctx.status?.customFieldsData ? JSON.parse(ctx.status.customFieldsData) : {};
      return fields.filter((f) => data[f.id]).map((f) => ({ label: f.label, value: data[f.id] }));
    } catch {
      return [];
    }
  }, [c.registrationFields, ctx.status?.customFieldsData]);

  return (
    <Shell ctx={ctx} heading="Akun" allowPending>
      <div className="grid grid-cols-1 gap-4 md:max-w-3xl md:grid-cols-2">
        <div className="flex items-center gap-3.5 md:col-span-2">
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white text-xl font-black shadow-[inset_0_0_0_1px_#E6E6E0]">
            {initials(ctx.currentUser?.name)}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <b className="truncate text-xl">{ctx.currentUser?.name}</b>
            <span className="text-sm text-[#55585E]">
              {ctx.status?.membershipNumber ? `${ctx.status.membershipNumber} · ` : ""}
              {ctx.status?.status === "APPROVED" ? "member aktif" : ctx.status?.status === "PENDING" ? "menunggu persetujuan" : "akun"}
            </span>
          </span>
        </div>
        <ProfileForm ctx={ctx} />
        <div className="flex flex-col gap-4">
          {answers.length > 0 && (
            <div className={`${card} px-4 py-1`}>
              <b className="block py-3 text-[17px]">Data pendaftaran</b>
              {answers.map((a) => (
                <div key={a.label} className="flex justify-between gap-3 border-t border-[#EEEEE8] py-3 text-[15px]">
                  <span className="text-[#55585E]">{a.label}</span>
                  <b className="text-right">{a.value}</b>
                </div>
              ))}
            </div>
          )}
          <div className={`${card} px-4`}>
            <Link href={clubHref(ctx.base)} className="flex min-h-[58px] items-center gap-3.5 border-b border-[#EEEEE8]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F1EC]">
                <Home className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <b className="flex-1 text-[15px]">Lihat halaman klub</b>
              <ChevronRight className="h-4 w-4 text-[#8A8C91]" strokeWidth={2.4} aria-hidden="true" />
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-[58px] items-center gap-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F1EC]">
                  <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <b className="flex-1 text-[15px]">Hubungi pengurus</b>
                <ChevronRight className="h-4 w-4 text-[#8A8C91]" strokeWidth={2.4} aria-hidden="true" />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={ctx.logout}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white text-[15px] font-bold text-[#B42318] shadow-[inset_0_0_0_1px_#F4C7C3]"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            Keluar
          </button>
        </div>
      </div>
    </Shell>
  );
}

function ProfileForm({ ctx }: { ctx: ClubCtx }) {
  const [name, setName] = useState(ctx.currentUser?.name || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setName(ctx.currentUser?.name || "");
  }, [ctx.currentUser?.name]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body: { name: string; password?: string } = { name };
      if (password) body.password = password;
      const res = await fetch(getApiUrl() + "/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Gagal menyimpan profil");
      setPassword("");
      setMessage({ ok: true, text: "Profil tersimpan." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Terjadi kesalahan" });
    } finally {
      setSaving(false);
    }
  };

  const input = "min-h-12 w-full rounded-[14px] border border-[#DDDDD6] bg-[#FBFBF8] px-3.5 text-base font-medium outline-none focus:border-[var(--club)] focus:ring-2 focus:ring-[var(--club-soft)]";
  return (
    <form onSubmit={save} className={`${card} flex flex-col gap-3.5 p-[18px]`}>
      <b className="text-[17px]">Profil</b>
      {message && (
        <p role="status" className={`rounded-xl px-3 py-2 text-sm font-semibold ${message.ok ? "bg-[#D6FBEF] text-[#0B6B53]" : "bg-[#FEE4E2] text-[#912018]"}`}>
          {message.text}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Nama lengkap
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Email
        <input type="email" value={ctx.currentUser?.email || ""} disabled className={`${input} cursor-not-allowed text-[#55585E]`} />
        <span className="text-xs font-normal text-[#55585E]">Email tidak bisa diubah.</span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Password baru
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kosongkan bila tidak diganti" autoComplete="new-password" className={input} />
      </label>
      <button type="submit" disabled={saving} className={btnDark}>
        {saving ? "Menyimpan…" : "Simpan perubahan"}
      </button>
    </form>
  );
}

// ---------- Check-in sheet ----------

export function CheckinSheet({
  ctx,
  initialKey,
  onClose,
  onSubmit,
}: {
  ctx: ClubCtx;
  initialKey?: string;
  onClose: () => void;
  /** checkOut=true marks today's session as finished (no session is returned) */
  onSubmit: (wallet: ActiveWalletView, checkOut: boolean) => Promise<boolean>;
}) {
  const options = ctx.wallets.filter((w) => w.status === "ACTIVE" || PENDING.includes(w.status));
  const firstUsable = options.find((w) => w.status === "ACTIVE" && w.remainingSession > 0);
  const [selected, setSelected] = useState(initialKey && options.some((w) => w.walletKey === initialKey) ? initialKey : firstUsable?.walletKey);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<ActiveWalletView | null>(null);
  const wallet = options.find((w) => w.walletKey === selected);
  const already = wallet ? checkedInToday(wallet, ctx.history) : false;
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async (checkOut: boolean, target = wallet) => {
    if (!target) return;
    setBusy(true);
    const ok = await onSubmit(target, checkOut);
    setBusy(false);
    if (!ok) return;
    if (checkOut) {
      onClose();
    } else {
      setDone(target);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-[#111214]/50 md:items-center" onClick={() => !busy && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Check-in sesi"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col gap-4 overflow-y-auto rounded-t-[30px] bg-[#F6F6F2] px-[18px] pb-[max(26px,env(safe-area-inset-bottom))] pt-2.5 md:max-w-md md:rounded-[30px] md:p-7"
      >
        <span aria-hidden="true" className="mx-auto h-[5px] w-[42px] rounded-full bg-[#CFCFC8] md:hidden" />
        {done ? (
          <div role="status" className="flex flex-col items-center gap-3.5 pt-1.5 text-center">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#2CE5B0]">
              <Check className="h-9 w-9 text-[#111214]" strokeWidth={2.8} aria-hidden="true" />
            </span>
            <h2 className="text-[30px] font-black tracking-[-0.04em]">Selamat latihan!</h2>
            <span className="text-[15px] text-[#55585E]">
              {walletOwner(done, ctx)} · {done.packageName}
            </span>
            <div className={`${card} flex items-baseline gap-2 px-[22px] py-3.5`}>
              <b className="text-[40px] font-black leading-none tracking-[-0.04em]">{Math.max(0, done.remainingSession - 1)}</b>
              <span className="text-[15px] font-semibold text-[#55585E]">dari {done.totalSession} sesi tersisa</span>
            </div>
            <button type="button" onClick={onClose} className={`${btnDark} min-h-14 w-full text-[17px]`}>
              Selesai
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-[30px] font-black tracking-[-0.04em]">Check-in sesi</h2>
              <span className="text-[15px] capitalize text-[#55585E]">{today}</span>
            </div>
            {options.length === 0 ? (
              <EmptyCard title="Belum ada paket aktif" body="Beli paket dulu untuk bisa check-in." />
            ) : (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-bold">Untuk siapa?</legend>
                {options.map((w) => {
                  const usable = w.status === "ACTIVE" && w.remainingSession > 0;
                  const on = w.walletKey === selected;
                  const doneToday = checkedInToday(w, ctx.history);
                  return (
                    <button
                      key={w.walletKey}
                      type="button"
                      disabled={!usable || busy}
                      aria-pressed={on}
                      onClick={() => setSelected(w.walletKey)}
                      className={`flex min-h-[68px] items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 text-left disabled:opacity-55 ${on ? "ring-2 ring-[#111214]" : "ring-1 ring-[#E6E6E0]"}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-[#111214]" : "border-[#CFCFC8]"}`}>
                        {on && <span className="h-3 w-3 rounded-full bg-[var(--club)]" />}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <b className="truncate text-base">{walletOwner(w, ctx)}</b>
                        <span className="truncate text-[13px] text-[#55585E]">
                          {w.packageName} ·{" "}
                          {!usable
                            ? w.status === "ACTIVE"
                              ? "sesi habis"
                              : "menunggu konfirmasi bayar"
                            : doneToday
                              ? "sudah check-in hari ini"
                              : `sisa ${w.remainingSession} sesi`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </fieldset>
            )}
            <span className="text-[13px] leading-relaxed text-[#55585E]">
              {already
                ? "Sudah check-in hari ini. Check-out menandai sesi selesai; sesi yang sudah terpakai tidak dikembalikan."
                : "1 sesi dipakai dari paket orang yang dipilih."}
            </span>
            {already ? (
              <button type="button" disabled={busy || !wallet} onClick={() => submit(true)} className={`${btnDark} min-h-14 text-[17px]`}>
                {busy ? "Memproses…" : "Check-out (selesai sesi)"}
              </button>
            ) : (
              <button type="button" disabled={busy || !wallet || !firstUsable} onClick={() => submit(false)} className={`${btnClub} min-h-14 text-[17px]`}>
                {busy ? "Memproses…" : "Check-in sekarang"}
              </button>
            )}
            <button type="button" onClick={onClose} disabled={busy} className="-mt-2 min-h-11 text-[15px] font-bold">
              Batal
            </button>
          </>
        )}
      </section>
    </div>
  );
}
