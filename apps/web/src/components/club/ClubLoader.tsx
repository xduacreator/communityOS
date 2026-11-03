"use client";

import { createContext, useContext, type ReactNode } from "react";
import { clubThemeStyle, initials } from "../../lib/club";
import { outfit } from "../../lib/fonts";

/** What the loader needs to look like the club before the page itself arrives */
export interface ClubBrand {
  name: string;
  logo?: string | null;
  theme?: string | null;
}

const ClubBrandContext = createContext<ClubBrand | null>(null);

export function ClubBrandProvider({ brand, children }: { brand: ClubBrand | null; children: ReactNode }) {
  return <ClubBrandContext.Provider value={brand}>{children}</ClubBrandContext.Provider>;
}

const KEYFRAMES = `
@keyframes club-loader-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes club-loader-breathe { 0%, 100% { transform: scale(1) } 50% { transform: scale(0.94) } }
@media (prefers-reduced-motion: reduce) {
  .club-loader-breathe, .club-loader-ring { animation: none !important }
}
`;

/**
 * Full-screen loader showing the club's own logo (or its initials when no
 * logo was uploaded) inside a spinning ring in the club colour.
 */
export function ClubLoader({
  brand,
  leaving = false,
  delayed = false,
}: {
  brand: ClubBrand;
  /** Fade out before being removed */
  leaving?: boolean;
  /** Wait a moment before appearing, so quick loads don't flash a loader */
  delayed?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Memuat ${brand.name}`}
      className={`${outfit.className} fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-[#F6F6F2] transition-opacity duration-300 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        ...clubThemeStyle(brand.theme),
        animation: delayed ? "club-loader-in 220ms ease-out 120ms both" : undefined,
      }}
    >
      <style>{KEYFRAMES}</style>
      <div className="relative flex h-[104px] w-[104px] items-center justify-center">
        <svg viewBox="0 0 104 104" className="club-loader-ring absolute inset-0 h-full w-full animate-spin [animation-duration:1.1s]" aria-hidden>
          <circle cx="52" cy="52" r="49" fill="none" stroke="var(--club-soft)" strokeWidth="4" />
          <circle
            cx="52"
            cy="52"
            r="49"
            fill="none"
            stroke="var(--club)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 228"
          />
        </svg>
        <span
          className="club-loader-breathe flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-full bg-[var(--club)] text-[26px] font-extrabold text-[var(--club-on)] shadow-[0_6px_20px_rgba(17,18,20,0.12)]"
          style={{ animation: "club-loader-breathe 1.6s ease-in-out infinite" }}
        >
          {brand.logo ? <img src={brand.logo} alt="" className="h-full w-full object-cover" /> : initials(brand.name)}
        </span>
      </div>
      <p className="max-w-[260px] truncate text-center text-[15px] font-extrabold tracking-tight text-[#111214]">{brand.name}</p>
    </div>
  );
}

/** Route-level loading screen (loading.tsx) for club pages */
export function ClubRouteLoading() {
  const brand = useContext(ClubBrandContext);
  if (!brand) return null;
  return <ClubLoader brand={brand} delayed />;
}
