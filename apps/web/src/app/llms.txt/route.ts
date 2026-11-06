import { apiGet } from "@/lib/server-api";
import { getCommunity } from "@/lib/club-server";
import { CLUB_PUBLIC_PATHS, getSiteHost } from "@/lib/site";
import { HOME_FAQS, homeText, whatsappUrl } from "@/lib/home-content";
import { perSessionPrice, rupiah, visiblePackages, whatsappLink } from "@/lib/club";
import type { BlogPostSummary } from "@/lib/blog";
import type { Community, Event, SessionPackage } from "@/types";

// llms.txt (https://llmstxt.org): a plain Markdown summary for AI assistants,
// answered per host like sitemap.xml
export const dynamic = "force-dynamic";

interface SitemapClub {
  slug: string;
  name: string;
  tagline?: string | null;
}

interface SlugPage {
  slug: string;
  title?: string | null;
  h1?: string | null;
  isActive?: boolean;
}

const oneLine = (text: string | null | undefined) => String(text || "").replace(/\s+/g, " ").trim();

function text(body: string) {
  return new Response(body.replace(/\n{3,}/g, "\n\n").trim() + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}

async function platformLlms(origin: string) {
  const [settings, posts, clubs, landingPages, customPages] = await Promise.all([
    apiGet<Record<string, string>>("/system-settings", {}, 300),
    apiGet<BlogPostSummary[]>("/blog-post", [], 300),
    apiGet<SitemapClub[]>("/communities/public/sitemap", [], 300),
    apiGet<SlugPage[]>("/landing-page", [], 300),
    apiGet<SlugPage[]>("/custom-page", [], 300),
  ]);
  const name = settings["platform.name"] || "Latih.Club";
  const pages = [...landingPages, ...customPages].filter((p) => p.isActive !== false && p.slug);
  const tiles = (["owner", "group", "coach", "packages", "member"] as const).map(
    (k) => `- **${homeText(settings, `home.tile.${k}.title`)}**: ${homeText(settings, `home.tile.${k}.desc`)}`,
  );

  return `
# ${name}

> ${name} adalah sistem untuk menjalankan klub dan kelas latihan di Indonesia: pendaftaran member, paket sesi latihan, pembayaran, dan absensi dalam satu tempat. Member senang, coach fokus, owner tenang.

Setiap klub mendapat halaman sendiri (microsite) di ${origin}/namaklub, misalnya ${origin}/jakartarunners. Member tidak perlu memasang aplikasi: mereka mendaftar, membeli paket, membayar (QRIS atau transfer), dan check-in dari browser HP. Pendaftaran klub baru dilakukan lewat WhatsApp dengan tim ${name}, tidak bisa daftar mandiri.

## Fitur

${tiles.join("\n")}
- **Voucher & promo**: potongan nominal atau persen, dengan batas kuota.
- **Link klub sendiri**: latih.club/namaklub, siap dibagikan ke member.
- **Export absensi**: riwayat kehadiran ke CSV.

## Tanya jawab

${HOME_FAQS.map(([q, a]) => `- **${q}** ${a}`).join("\n")}

## Halaman utama

- [Beranda ${name}](${origin}/): penjelasan produk, contoh klub, dan cara mulai
- [Blog](${origin}/blog): artikel seputar mengelola klub dan latihan
- [Daftarkan klub lewat WhatsApp](${whatsappUrl(settings)})

${posts.length ? `## Artikel blog\n\n${posts.map((p) => `- [${oneLine(p.title)}](${origin}/blog/${p.slug})${p.excerpt ? `: ${oneLine(p.excerpt)}` : ""}`).join("\n")}` : ""}

${clubs.length ? `## Klub di ${name}\n\n${clubs.map((c) => `- [${oneLine(c.name)}](${origin}/${c.slug})${c.tagline ? `: ${oneLine(c.tagline)}` : ""}`).join("\n")}` : ""}

${pages.length ? `## Halaman lain\n\n${pages.map((p) => `- [${oneLine(p.title || p.h1 || p.slug)}](${origin}/${p.slug})`).join("\n")}` : ""}
`;
}

async function clubLlms(origin: string, club: Community) {
  const [packages, events] = await Promise.all([
    apiGet<SessionPackage[]>(`/session-package/community/${club.id}`, [], 300),
    apiGet<Event[]>(`/events/community/${club.id}`, [], 300),
  ]);
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now).sort((a, b) => a.date.localeCompare(b.date));
  const wa = whatsappLink(club.whatsappNumber);
  const pkgLines = visiblePackages(packages).map((p) => {
    const facts = [`${p.totalSession} sesi`, `berlaku ${p.validDays} hari`, `${rupiah(p.memberPrice)} per orang`];
    if (p.totalSession > 1) facts.push(`${rupiah(perSessionPrice(p))} per sesi`);
    if (p.vipPrice) facts.push(`privat ${rupiah(p.vipPrice)}`);
    const category = [p.category?.activity?.name || p.activity?.name, p.category?.name].filter(Boolean).join(" · ");
    return `- **${oneLine(p.name)}**${category ? ` (${category})` : ""}: ${facts.join(", ")}.${p.description ? ` ${oneLine(p.description)}` : ""}`;
  });

  return `
# ${oneLine(club.name)}

> ${oneLine(club.tagline || club.shortDescription || `Klub latihan ${club.name}`)}

${club.shortDescription && club.tagline ? oneLine(club.shortDescription) : ""}

${club.about ? club.about.trim() : ""}

## Cara gabung

${club.registrationMode === "PAID"
    ? "Daftar lewat tombol gabung di halaman klub, pilih paket membership, lalu bayar. Akun aktif setelah dikonfirmasi pengurus."
    : "Daftar gratis lewat tombol gabung di halaman klub. Setelah disetujui pengurus, member bisa membeli paket latihan."}
Paket dibayar lewat transfer atau QRIS sesuai instruksi klub. Member check-in sendiri dari halaman member.

${pkgLines.length ? `## Paket latihan\n\n${pkgLines.join("\n")}` : ""}

${upcoming.length ? `## Event mendatang\n\n${upcoming.map((e) => `- **${oneLine(e.title)}**, ${new Date(e.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${e.location ? ` di ${oneLine(e.location)}` : ""}${e.description ? `: ${oneLine(e.description)}` : ""}`).join("\n")}` : ""}

## Kontak

${wa ? `- WhatsApp pengurus: ${wa}` : ""}
${club.contactInfo ? club.contactInfo.replace(/\\n/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => `- ${l}`).join("\n") : ""}

## Halaman

${CLUB_PUBLIC_PATHS.map(({ path, label }) => `- [${label}](${origin}${path || "/"})`).join("\n")}

Halaman klub ini dikelola dengan Latih.Club (https://latih.club).
`;
}

export async function GET() {
  const site = await getSiteHost();
  if (site.kind === "club") {
    const club = await getCommunity(site.slug);
    if (!club) return new Response("Not found\n", { status: 404 });
    return text(await clubLlms(site.origin, club));
  }
  return text(await platformLlms(site.origin));
}
