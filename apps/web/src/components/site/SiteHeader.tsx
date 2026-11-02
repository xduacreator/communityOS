import Link from "next/link";
import { Zap } from "lucide-react";
import { whatsappUrl } from "@/lib/home-content";

const NAV = [
  { href: "/#fitur", label: "Fitur", key: "fitur" },
  { href: "/#mulai", label: "Cara Mulai", key: "mulai" },
  { href: "/#klub", label: "Klub", key: "klub" },
  { href: "/blog", label: "Blog", key: "blog" },
  { href: "/#faq", label: "FAQ", key: "faq" },
];

// Uses the logo uploaded in Super Admin → Settings (platform.logo), else the default mark + name
export function SiteLogo({ settings }: { settings: Record<string, string> }) {
  const name = settings["platform.name"] || "Latih.Club";
  const logo = settings["platform.logo"];
  if (logo) {
    return (
      <Link href="/" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="h-10 w-auto max-w-[200px] object-contain" />
      </Link>
    );
  }
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-[14px] bg-[#111214]">
        <Zap className="h-5 w-5 text-[#2CE5B0]" strokeWidth={2.6} aria-hidden="true" />
      </span>
      <span className="text-[22px] font-extrabold tracking-tight">{name}</span>
    </Link>
  );
}

export default function SiteHeader({ settings, active }: { settings: Record<string, string>; active?: string }) {
  return (
    <header className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
      <SiteLogo settings={settings} />
      <nav aria-label="Navigasi utama" className="hidden flex-wrap items-center gap-1 text-[15px] font-semibold md:flex">
        {NAV.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active === item.key ? "page" : undefined}
            className={`rounded-full px-3.5 py-2.5 transition hover:bg-white ${active === item.key ? "bg-white shadow-[0_1px_0_#E6E6E0]" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <a
        href={whatsappUrl(settings)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center rounded-full bg-[#111214] px-5 text-[15px] font-bold text-white transition hover:bg-[#2a2c30]"
      >
        Daftarkan Klub
      </a>
    </header>
  );
}
