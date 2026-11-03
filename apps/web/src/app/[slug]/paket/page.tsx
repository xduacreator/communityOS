import { ClubPage, clubPageMetadata } from "../../../components/club/ClubPage";

export const generateMetadata = clubPageMetadata("Paket");

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ClubPage params={params} view="packages" />;
}
