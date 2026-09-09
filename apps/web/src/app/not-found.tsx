'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, Home } from 'lucide-react';
import styles from './not-found.module.css';
import { getApiUrl } from '../lib/api';

export default function NotFound() {
  const pathname = usePathname();
  const [home, setHome] = useState({ href: '/', community: false });

  useEffect(() => {
    const controller = new AbortController();
    setHome({ href: '/', community: false });
    const hostname = window.location.hostname.toLowerCase();
    const configured = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').toLowerCase();
    const roots = ['latih.club', 'www.latih.club', 'communityos.com', 'www.communityos.com', 'localhost', '127.0.0.1', configured, `www.${configured.replace(/^www\./, '')}`];
    const rootHost = roots.includes(hostname) || hostname.includes('localhost') || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const domain = ['latih.club', configured].find(value => value && hostname.endsWith(`.${value}`));
    const candidate = rootHost ? pathname?.split('/').filter(Boolean)[0] : domain ? hostname.slice(0, -(domain.length + 1)) : hostname;
    const reserved = ['login', 'register', 'super-admin', 'blog', 'privacy-policy', 'terms-conditions'];
    if (!candidate || reserved.includes(candidate)) return () => controller.abort();

    // Verify the community before offering its home; never infer one from an arbitrary URL.
    fetch(`${getApiUrl()}/communities/${encodeURIComponent(candidate)}`, { signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(community => {
        if (!controller.signal.aborted && community?.id && community?.slug) {
          setHome({ href: rootHost ? `/${encodeURIComponent(community.slug)}` : '/', community: true });
        }
      })
      .catch(() => { /* Keep the safe default if the community cannot be resolved. */ });
    return () => controller.abort();
  }, [pathname]);

  return (
    <div lang="id" className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#fafbfc] text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_35%,#e0e7ff_0%,transparent_65%)]" />
      <header className="mx-auto w-full max-w-6xl px-6 py-7 sm:px-10">
        <Link href={home.href} aria-label={home.community ? 'Kembali ke home komunitas' : 'Latih.Club — halaman utama'} className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-indigo-600">
          <Image src="/images/logo.svg" alt="Latih.Club" width={160} height={48} priority className="h-10 w-auto" />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-10 sm:py-16">
        <p className="mb-6 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-bold tracking-[0.16em] text-indigo-700">
          ERROR 404 · DI LUAR JALUR
        </p>

        <svg aria-hidden="true" focusable="false" viewBox="0 0 640 320" className="mb-6 w-full max-w-xl overflow-visible">
          <defs>
            <linearGradient id="court" x2="1" y2="1">
              <stop stopColor="#818cf8" /><stop offset="1" stopColor="#4338ca" />
            </linearGradient>
          </defs>
          <ellipse cx="320" cy="286" rx="246" ry="22" fill="#c7d2fe" opacity=".45" />
          <circle cx="320" cy="140" r="128" fill="#eef2ff" />
          <g transform="translate(88 165) skewX(-22) scale(1 .55)">
            <rect width="470" height="180" rx="22" fill="#3730a3" transform="translate(0 16)" />
            <rect width="470" height="180" rx="22" fill="url(#court)" />
            <g fill="none" stroke="#e0e7ff" strokeWidth="3" opacity=".7">
              <rect x="22" y="20" width="426" height="140" rx="6" />
              <path d="M235 20v140M22 90h426M85 20v140M385 20v140" />
              <circle cx="235" cy="90" r="44" />
            </g>
          </g>
          <text x="320" y="199" textAnchor="middle" fill="#312e81" stroke="#fafbfc" strokeWidth="8" paintOrder="stroke" fontSize="172" fontWeight="900" letterSpacing="-12">404</text>
          <g transform="translate(510 93) rotate(12)">
            <path d="M0 0v115" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
            <path d="M0 0h62L49 21l13 21H0Z" fill="#bef264" />
            <path d="m19 21h23m-8-8 9 8-9 8" fill="none" stroke="#365314" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <ellipse cx="160" cy="263" rx="30" ry="8" fill="#312e81" opacity=".18" />
          <g className={styles.ball}>
            <circle cx="160" cy="223" r="29" fill="#bef264" stroke="#65a30d" strokeWidth="2" />
            <path d="M142 201c21 14 27 29 27 49M135 235c16-20 31-26 47-25" fill="none" stroke="#f7fee7" strokeWidth="4" />
            <circle cx="150" cy="212" r="5" fill="white" opacity=".4" />
          </g>
          <g fill="none" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round">
            <path d="M102 104v16m-8-8h16M445 45v12m-6-6h12M551 245v12m-6-6h12" />
            <path d="M69 174c-23-40 16-64 44-35" strokeDasharray="5 8" />
          </g>
          <circle cx="220" cy="48" r="5" fill="#bef264" />
          <circle cx="573" cy="162" r="4" fill="#818cf8" />
        </svg>

        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Sepertinya kita salah jalur.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
          Halaman yang kamu cari tidak ditemukan. Mungkin tautannya sudah berubah atau alamatnya kurang tepat.
        </p>
        <Link href={home.href} className="group mt-9 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
          <Home aria-hidden="true" className="size-4" />
          {home.community ? 'Kembali ke Home Komunitas' : 'Kembali ke Home'}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <p className="mt-5 text-sm text-slate-500">Tujuannya tetap sama: tumbuh bersama komunitas.</p>
      </main>

      <footer className="px-6 py-7 text-center text-xs text-slate-500">
        Latih.Club <span aria-hidden="true">·</span> Tempat komunitas terus bergerak.
      </footer>
    </div>
  );
}
