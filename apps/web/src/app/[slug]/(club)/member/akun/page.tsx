import { ClubPage, clubPageMetadata } from "../../../../../components/club/ClubPage";

export const generateMetadata = clubPageMetadata("Member");

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ClubPage params={params} view="member-account" />;
}
