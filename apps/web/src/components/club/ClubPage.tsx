import { notFound } from "next/navigation";
import CommunityMicrosite from "../CommunityMicrosite";
import { clubMetadata, getClubBase, getCommunity } from "../../lib/club-server";
import type { ClubView } from "./types";

type Params = Promise<{ slug: string }>;

/** Server entry for every club page: loads the club and renders the requested view */
export async function ClubPage({ params, view }: { params: Params; view: ClubView }) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();
  const base = await getClubBase(slug);
  return <CommunityMicrosite community={community} slug={slug} view={view} base={base} />;
}

export function clubPageMetadata(pageName: string | ((labels: Record<string, string>) => string)) {
  return async ({ params }: { params: Params }) => {
    const { slug } = await params;
    const community = await getCommunity(slug);
    if (!community) return { title: "Tidak ditemukan" };
    const name =
      typeof pageName === "function"
        ? pageName({
            events: community.menuEventsLabel || "Event",
            about: community.menuAboutLabel || "Tentang",
            gallery: community.menuGalleryLabel || "Galeri",
            contact: community.menuContactLabel || "Kontak",
          })
        : pageName;
    return { ...clubMetadata(community, name), robots: pageName === "Member" ? { index: false } : undefined };
  };
}
