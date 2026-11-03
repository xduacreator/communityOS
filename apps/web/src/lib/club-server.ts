import { cache } from "react";
import { headers } from "next/headers";
import type { Community } from "../types";
import { getApiUrl } from "./api";

function apiBases(): string[] {
  return Array.from(
    new Set(
      [
        process.env.INTERNAL_API_URL,
        "http://api:3001/api",
        getApiUrl(),
        "http://localhost:3001/api",
        "http://127.0.0.1:3001/api",
      ].filter(Boolean) as string[],
    ),
  );
}

// Cached per request: the club layout, metadata and page all ask for the same club
export const getCommunity = cache(async function getCommunity(slug: string): Promise<Community | null> {
  for (const baseUrl of apiBases()) {
    try {
      const clean = baseUrl.replace(/\/$/, "");
      const url = clean.endsWith("/api") ? `${clean}/communities/${slug}` : `${clean}/api/communities/${slug}`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (res.ok) return (await res.json()) as Community;
      if (res.status === 404) return null;
    } catch {
      // Try next endpoint candidate
    }
  }
  return null;
});

/**
 * Path prefix for club links. On latih.club the club lives at /{slug};
 * on a club subdomain or custom domain the middleware rewrites, so links
 * must not repeat the slug.
 */
export async function getClubBase(slug: string): Promise<string> {
  const host = ((await headers()).get("host") || "").split(":")[0].toLowerCase();
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "").toLowerCase().replace(/^www\./, "");
  const isRoot =
    !host ||
    host === "localhost" ||
    host.includes("localhost") ||
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) ||
    ["latih.club", "www.latih.club", "communityos.com", "www.communityos.com"].includes(host) ||
    (root !== "" && (host === root || host === `www.${root}`));
  return isRoot ? `/${slug}` : "";
}

export function clubMetadata(c: Community, page?: string) {
  const title = page ? `${page} · ${c.name}` : c.seoTitle || c.name;
  const description = c.seoDescription || c.shortDescription || c.about || `Selamat datang di ${c.name}`;
  return {
    title,
    description,
    keywords: c.seoKeywords || undefined,
    openGraph: {
      title,
      description,
      images: c.heroBanner || c.logo ? [c.heroBanner || c.logo || ""] : [],
    },
  };
}
