import { getApiUrl } from "./api";

// Server-side GET that tries the internal API first (Docker), then public URLs.
// revalidate: seconds to cache, or false to always fetch fresh. Use false when the
// resource can start returning 404 (Next keeps serving a cached 200 in that case).
export async function apiGet<T>(path: string, fallback: T, revalidate: number | false): Promise<T> {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    "http://api:3001/api",
    getApiUrl(),
    "http://localhost:3001/api",
    "http://127.0.0.1:3001/api",
  ].filter(Boolean) as string[];

  for (const baseUrl of Array.from(new Set(candidateUrls))) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = cleanBase.endsWith("/api") ? `${cleanBase}${path}` : `${cleanBase}/api${path}`;
      const res = await fetch(url, {
        ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate } }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return (await res.json()) as T;
      // The API answered; a 404 will not change on another host
      if (res.status === 404) return fallback;
    } catch {
      // Try next endpoint candidate
    }
  }
  return fallback;
}
