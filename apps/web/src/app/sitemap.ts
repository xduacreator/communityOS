import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/server-api";
import { getCommunity } from "@/lib/club-server";
import { CLUB_PUBLIC_PATHS, getSiteHost } from "@/lib/site";
import type { BlogPostSummary } from "@/lib/blog";

// Built per request: the host decides between the platform and a club's own sitemap
export const dynamic = "force-dynamic";

interface SitemapClub {
  slug: string;
  updatedAt?: string;
}

interface SlugPage {
  slug: string;
  isActive?: boolean;
  updatedAt?: string;
}

const date = (value?: string | null) => (value ? new Date(value) : undefined);

function clubEntries(origin: string, base: string, updatedAt?: string): MetadataRoute.Sitemap {
  return CLUB_PUBLIC_PATHS.map(({ path }) => ({
    url: `${origin}${base}${path || (base ? "" : "/")}`,
    lastModified: date(updatedAt),
    changeFrequency: path === "/paket" || path === "/event" ? "daily" : "weekly",
    priority: path === "" ? 0.8 : 0.6,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteHost();

  if (site.kind === "club") {
    const club = await getCommunity(site.slug);
    return club ? clubEntries(site.origin, "", club.updatedAt) : [];
  }

  const [posts, clubs, landingPages, customPages] = await Promise.all([
    apiGet<BlogPostSummary[]>("/blog-post", [], 300),
    apiGet<SitemapClub[]>("/communities/public/sitemap", [], 300),
    apiGet<SlugPage[]>("/landing-page", [], 300),
    apiGet<SlugPage[]>("/custom-page", [], 300),
  ]);
  const { origin } = site;
  const latestPost = posts.map((p) => p.updatedAt).sort().pop();

  return [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/blog`, lastModified: date(latestPost), changeFrequency: "daily", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${origin}/blog/${encodeURIComponent(p.slug)}`,
      lastModified: date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...[...landingPages, ...customPages]
      .filter((p) => p.isActive !== false && p.slug)
      .map((p) => ({
        url: `${origin}/${encodeURIComponent(p.slug)}`,
        lastModified: date(p.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ...clubs.flatMap((c) => clubEntries(origin, `/${encodeURIComponent(c.slug)}`, c.updatedAt)),
  ];
}
