import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ClubBrandProvider } from "../../../components/club/ClubLoader";
import { getCommunity } from "../../../lib/club-server";
import { getCustomPageData, getLandingPageData } from "../../../lib/slug-pages";

/**
 * Shared by all public and member club pages. Hands the club's name, logo and
 * colour to the loading screen; each page still renders itself.
 */
export default async function ClubLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) {
    // The pages below sit behind a loading screen, so a missing page must be
    // caught here to still answer with a real 404. The slug may instead be an
    // SEO landing page or custom page, which the home page renders.
    const [landing, custom] = await Promise.all([getLandingPageData(slug), getCustomPageData(slug)]);
    if (!landing?.isActive && !custom?.isActive) notFound();
  }
  const brand = community ? { name: community.name, logo: community.logo, theme: community.theme } : null;
  return <ClubBrandProvider brand={brand}>{children}</ClubBrandProvider>;
}
