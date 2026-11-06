import { headers } from "next/headers";

// Hosts that serve the latih.club platform itself (landing, blog, /{slug} club pages)
const ROOT_HOSTS = ["latih.club", "www.latih.club", "communityos.com", "www.communityos.com", "localhost", "127.0.0.1"];

export type SiteHost =
  /** latih.club: the platform, with clubs under /{slug} */
  | { kind: "platform"; origin: string }
  /** A club's subdomain (klub.latih.club) or own domain: club pages at the root */
  | { kind: "club"; origin: string; slug: string };

/**
 * Which site a request is for, mirroring the middleware's host rules.
 * sitemap.xml, robots.txt and llms.txt skip the middleware (their paths
 * contain a dot), so they answer per host themselves.
 */
export async function getSiteHost(): Promise<SiteHost> {
  const h = await headers();
  const rawHost = (h.get("x-forwarded-host") || h.get("host") || "latih.club").split(",")[0].trim();
  const hostname = rawHost.split(":")[0].toLowerCase();
  const local = hostname === "localhost" || hostname.endsWith(".localhost") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const proto = (h.get("x-forwarded-proto") || (local ? "http" : "https")).split(",")[0].trim();
  const origin = `${proto}://${rawHost}`;

  const configured = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "").toLowerCase().replace(/^www\./, "");
  const roots = configured ? [...ROOT_HOSTS, configured, `www.${configured}`] : ROOT_HOSTS;
  if (roots.includes(hostname) || local) return { kind: "platform", origin };

  for (const root of ["latih.club", configured].filter(Boolean)) {
    if (hostname.endsWith(`.${root}`)) {
      const sub = hostname.slice(0, -(root.length + 1));
      if (sub && sub !== "www") return { kind: "club", origin, slug: sub };
    }
  }
  // Club's own domain: the API finds the club by its domain
  return { kind: "club", origin, slug: hostname };
}

/** Public club pages, relative to the club's base path */
export const CLUB_PUBLIC_PATHS = [
  { path: "", label: "Beranda" },
  { path: "/paket", label: "Paket latihan" },
  { path: "/event", label: "Event" },
  { path: "/tentang", label: "Tentang" },
  { path: "/galeri", label: "Galeri" },
  { path: "/kontak", label: "Kontak" },
] as const;

/** Paths that are private or only make sense after login */
export function privatePaths(clubBase: string): string[] {
  return ["admin", "member", "login", "register", "dashboard"].map((p) => `${clubBase}/${p}`);
}
