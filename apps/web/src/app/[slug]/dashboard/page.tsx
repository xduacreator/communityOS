import { redirect } from "next/navigation";
import { getClubBase } from "../../../lib/club-server";

// The member area moved to /member; keep old links working
export default async function MemberDashboardRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`${await getClubBase(slug)}/member`);
}
