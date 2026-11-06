import type { MetadataRoute } from "next";
import { getSiteHost, privatePaths } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteHost();
  const disallow =
    site.kind === "club"
      ? privatePaths("")
      : ["/super-admin", "/login", "/register", "/api/", ...privatePaths("/*")];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${site.origin}/sitemap.xml`,
  };
}
