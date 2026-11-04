import type { CSSProperties } from "react";

/**
 * The admin pages were built with Tailwind's indigo palette. Inside the admin
 * shell that palette is remapped to the latih.club ink tones, so every page
 * matches the club pages without rewriting each class.
 */
export const adminThemeStyle = {
  "--color-indigo-50": "#F3F3EF",
  "--color-indigo-100": "#E9E9E3",
  "--color-indigo-200": "#D9D9D2",
  "--color-indigo-300": "#B9BAB4",
  "--color-indigo-400": "#8A8C90",
  "--color-indigo-500": "#3A3C40",
  "--color-indigo-600": "#111214",
  "--color-indigo-700": "#2A2C30",
  "--color-indigo-800": "#111214",
  "--color-indigo-900": "#0B0B0C",
  "--color-indigo-950": "#000000",
} as CSSProperties;

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Disetujui",
  PENDING: "Menunggu",
  REJECTED: "Ditolak",
  ACTIVE: "Aktif",
  EXPIRED: "Kedaluwarsa",
  FROZEN: "Dibekukan",
  CANCELLED: "Dibatalkan",
  INACTIVE: "Nonaktif",
  WAITING_LIST: "Waiting list",
  WAITLIST: "Waiting list",
  REGISTERED: "Terdaftar",
  ATTENDED: "Hadir",
  COMPLETED: "Selesai",
  USED_UP: "Habis",
};

/** Human label for an API status code ("PENDING" → "Menunggu") */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return "-";
  return STATUS_LABELS[status] || status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  COMMUNITY_ADMIN: "Admin",
  COACH: "Coach",
  MEMBER: "Member",
};

export function roleLabel(role: string | null | undefined): string {
  return (role && ROLE_LABELS[role]) || role || "-";
}

/** 13 Nov 2026 */
export function adminDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** 19.30 */
export function adminTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Jum, 13 Nov 2026 · 19.30 */
export function adminDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  return `${d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${adminTime(d)}`;
}
