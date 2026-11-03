import type { CSSProperties } from "react";
import type { Community, SessionPackage } from "../types";

// ---------- Club theme colour ----------
// The club picks one colour in its settings. Everything else on the club
// pages stays neutral; these derived tones keep text readable for any colour.

type RGB = [number, number, number];

const DEFAULT_ACCENT = "#E4572E";
const INK: RGB = [17, 18, 20];
const WHITE: RGB = [255, 255, 255];

function parseHex(value: string | null | undefined): RGB | null {
  let hex = String(value || "").trim().replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: RGB, b: RGB): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
}

function toHex(c: RGB): string {
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export interface ClubPalette {
  accent: string;
  /** Text/icon colour placed on top of the accent */
  on: string;
  /** Accent darkened until it reads on white (links, small text) */
  text: string;
  /** Very light tint for active pills and soft backgrounds */
  soft: string;
}

export function clubPalette(theme: string | null | undefined): ClubPalette {
  const base = parseHex(theme) || (parseHex(DEFAULT_ACCENT) as RGB);
  let text = base;
  for (let t = 0.05; contrast(text, WHITE) < 4.6 && t <= 1; t += 0.05) {
    text = mix(base, [0, 0, 0], t);
  }
  return {
    accent: toHex(base),
    on: contrast(base, WHITE) >= contrast(base, INK) ? "#FFFFFF" : "#111214",
    text: toHex(text),
    soft: toHex(mix(base, WHITE, 0.88)),
  };
}

export function clubThemeStyle(theme: string | null | undefined): CSSProperties {
  const p = clubPalette(theme);
  return {
    "--club": p.accent,
    "--club-on": p.on,
    "--club-text": p.text,
    "--club-soft": p.soft,
    // Legacy variables used by the purchase/registration dialogs
    "--primary": p.accent,
    "--color-primary": p.accent,
  } as CSSProperties;
}

// ---------- Formatting ----------

export function rupiah(value: number | null | undefined): string {
  return "Rp " + Math.round(value || 0).toLocaleString("id-ID");
}

export function initials(name: string | null | undefined): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return new Date(value).toLocaleDateString("id-ID", opts);
}

export function daysUntil(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  let digits = String(number || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// ---------- Club content helpers ----------

export function clubLabels(c: Community) {
  return {
    home: c.menuHomeLabel || "Beranda",
    packages: c.packagesHeadingLabel || "Paket",
    events: c.menuEventsLabel || "Event",
    about: c.menuAboutLabel || "Tentang",
    gallery: c.menuGalleryLabel || "Galeri",
    contact: c.menuContactLabel || "Kontak",
    join: c.joinCtaLabel || "Gabung Klub",
  };
}

export function packageNeedsMembership(c: Community, p: SessionPackage): boolean {
  return c.registrationMode === "PAID" || (p.accessRule || "PUBLIC") !== "PUBLIC";
}

export function packageSlotsLeft(p: SessionPackage): number | null {
  if (p.quota === null || p.quota === undefined) return null;
  return Math.max(0, p.quota - (p.currentParticipants || 0));
}

export function perSessionPrice(p: SessionPackage): number {
  return p.totalSession > 0 ? (p.memberPrice || 0) / p.totalSession : 0;
}

/** Id of the package with the lowest price per session, when there is a real choice */
export function bestValuePackageId(packages: SessionPackage[]): string | null {
  const priced = packages.filter((p) => (p.memberPrice || 0) > 0 && p.totalSession > 0);
  if (priced.length < 2) return null;
  return priced.reduce((best, p) => (perSessionPrice(p) < perSessionPrice(best) ? p : best)).id;
}

export function visiblePackages(packages: SessionPackage[]): SessionPackage[] {
  return packages.filter((p) => !p.status || p.status === "ACTIVE");
}

export interface FaqItem {
  q: string;
  a: string;
}

// FAQ assembled from what the club has already configured
export function clubFaq(c: Community, packages: SessionPackage[]): FaqItem[] {
  const paid = c.registrationMode === "PAID";
  const memberOnly = packages.filter((p) => packageNeedsMembership(c, p)).length;
  const days = packages.map((p) => p.validDays).filter((d) => d > 0);
  const items: FaqItem[] = [
    {
      q: "Bagaimana cara gabung?",
      a: paid
        ? "Ketuk Gabung Klub, isi formulir, lalu pilih membership dan selesaikan pembayaran. Akun aktif setelah dikonfirmasi pengurus."
        : "Ketuk Gabung Klub dan isi formulir pendaftaran (gratis). Setelah disetujui pengurus, kamu bisa membeli paket latihan.",
    },
    {
      q: "Bisa sekalian daftarkan teman?",
      a: "Bisa, untuk paket yang tidak memerlukan membership: tambahkan hingga 5 orang saat membeli. Tiap orang punya kuota sesinya sendiri dan check-in atas namanya.",
    },
    {
      q: "Bagaimana cara bayarnya?",
      a:
        (c.paymentInstructions ? c.paymentInstructions.trim() : "Ikuti instruksi transfer saat checkout, lalu unggah bukti transfer.") +
        (c.qrisImageUrl ? " Bisa juga bayar via QRIS." : "") +
        " Paket aktif setelah pembayaran dikonfirmasi pengurus.",
    },
  ];
  if (memberOnly > 0 && c.memberships && c.memberships.length > 0) {
    items.push({
      q: "Perlu jadi member dulu?",
      a: paid
        ? "Ya, semua paket membutuhkan membership aktif. Membership dan paket bisa dibayar sekaligus."
        : `Pendaftaran member gratis. Membership berbayar hanya dibutuhkan untuk ${memberOnly} paket bertanda "Perlu membership".`,
    });
  }
  if (days.length > 0) {
    const min = Math.min(...days);
    const max = Math.max(...days);
    items.push({
      q: "Kalau sesi tidak habis?",
      a: `Sesi berlaku sesuai masa berlaku paket (${min === max ? `${min}` : `${min}–${max}`} hari). Sisa sesi dan tanggal berakhirnya selalu terlihat di halaman member.`,
    });
  }
  return items;
}

// ---------- Routing ----------

/**
 * Club pages live at /{slug}/... on latih.club, but at /... on a club
 * subdomain or custom domain (the middleware rewrites those). Client-side
 * fallback for components that don't receive the base from the server.
 */
export function clientClubBase(slug: string): string {
  if (typeof window === "undefined") return `/${slug}`;
  const path = window.location.pathname;
  return path === `/${slug}` || path.startsWith(`/${slug}/`) ? `/${slug}` : "";
}
