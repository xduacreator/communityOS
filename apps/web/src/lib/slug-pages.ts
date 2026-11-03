import { cache } from "react";
import { getApiUrl } from "./api";

// Non-club pages that also live at latih.club/{slug}: SEO landing pages and custom pages.

export const getLandingPageData = cache(async (slug: string) => {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    'http://api:3001/api',
    getApiUrl(),
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean) as string[];

  const uniqueUrls = Array.from(new Set(candidateUrls));

  for (const baseUrl of uniqueUrls) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, '');
      const url = cleanBase.endsWith('/api')
        ? `${cleanBase}/landing-page/${slug}`
        : `${cleanBase}/api/landing-page/${slug}`;

      const res = await fetch(url, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next
    }
  }
  return null;
});

export const getCustomPageData = cache(async (slug: string) => {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    'http://api:3001/api',
    getApiUrl(),
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean) as string[];

  const uniqueUrls = Array.from(new Set(candidateUrls));

  for (const baseUrl of uniqueUrls) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, '');
      const url = cleanBase.endsWith('/api')
        ? `${cleanBase}/custom-page/${slug}`
        : `${cleanBase}/api/custom-page/${slug}`;

      const res = await fetch(url, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next
    }
  }
  return null;
});
