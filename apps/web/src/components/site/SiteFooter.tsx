import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/home-content";
import { SiteLogo } from "./SiteHeader";

export default function SiteFooter({ settings, exampleHref }: { settings: Record<string, string>; exampleHref?: string }) {
  const platformName = settings["platform.name"] || "Latih.Club";
  const linkClass = "text-[#55585E] hover:text-[#111214]";

  return (
    <footer className="overflow-hidden rounded-t-[40px] bg-white shadow-[0_-1px_0_#E6E6E0]">
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-10 px-5 pt-12 sm:px-8 md:pt-[72px] lg:px-10">
        <div className="flex min-w-0 max-w-[360px] flex-[1.4_1_280px] flex-col gap-4">
          <SiteLogo name={platformName} />
          <p className="text-[15px] leading-relaxed text-[#55585E]">
            Sistem untuk menjalankan klub &amp; kelas latihan — pendaftaran, paket sesi, pembayaran, dan absensi dalam satu tempat.
          </p>
          <a
            href={whatsappUrl(settings)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2.5 self-start rounded-full bg-[#2CE5B0] px-[18px] text-[15px] font-bold text-[#111214]"
          >
            <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
            Chat via WhatsApp
          </a>
        </div>
        <nav aria-label="Produk" className="flex flex-[1_1_140px] flex-col gap-3 text-[15px]">
          <b className="text-sm">Produk</b>
          <Link href="/#fitur" className={linkClass}>Fitur</Link>
          <Link href="/#mulai" className={linkClass}>Cara Mulai</Link>
          <Link href="/#faq" className={linkClass}>FAQ</Link>
        </nav>
        <nav aria-label="Jelajahi" className="flex flex-[1_1_140px] flex-col gap-3 text-[15px]">
          <b className="text-sm">Jelajahi</b>
          <Link href="/blog" className={linkClass}>Blog</Link>
          <Link href="/#klub" className={linkClass}>Klub</Link>
          {exampleHref && <Link href={exampleHref} className={linkClass}>Contoh microsite</Link>}
        </nav>
        <nav aria-label="Bantuan" className="flex flex-[1_1_160px] flex-col gap-3 text-[15px]">
          <b className="text-sm">Bantuan</b>
          <a href={whatsappUrl(settings, false)} target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp</a>
          <Link href="/privacy-policy" className={linkClass}>Kebijakan Privasi</Link>
          <Link href="/terms-conditions" className={linkClass}>Syarat &amp; Ketentuan</Link>
        </nav>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1240px] flex-wrap justify-between gap-3 border-t border-[#EDEDE8] px-5 py-5 text-sm text-[#55585E] sm:px-8 lg:px-10">
        <span>© {new Date().getFullYear()} {platformName}. Semua hak dilindungi.</span>
        <span>Dibuat untuk klub latihan di Indonesia.</span>
      </div>
      <div aria-hidden="true" className="mx-auto max-w-[1240px] select-none overflow-hidden whitespace-nowrap px-5 text-[clamp(72px,15vw,220px)] font-black leading-[0.78] tracking-[-0.04em] text-[#F1F1EC] sm:px-8 lg:px-10">
        latih.club
      </div>
    </footer>
  );
}
