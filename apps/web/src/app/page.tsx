/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { 
  ArrowRight, 
  Globe, 
  Users, 
  Zap, 
  QrCode, 
  Activity, 
  Play, 
  ShieldCheck, 
  BarChart3, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Star
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface ShowcaseCommunity {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  shortDescription?: string | null;
  about?: string | null;
  logo?: string | null;
  heroBanner?: string | null;
  theme?: string | null;
}

interface ShowcaseCardItem {
  id: string;
  name: string;
  type: string;
  desc: string;
  image: string;
}

async function getSettings(): Promise<Record<string, string>> {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    'http://api:3001/api',
    getApiUrl(),
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean) as string[];

  const uniqueUrls = Array.from(new Set(candidateUrls));

  for (const baseUrl of uniqueUrls) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, '');
      const url = cleanBase.endsWith('/api')
        ? `${cleanBase}/system-settings`
        : `${cleanBase}/api/system-settings`;

      const res = await fetch(url, {
        next: { revalidate: 5 },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next endpoint candidate
    }
  }

  return {};
}

async function getShowcaseCommunities(): Promise<ShowcaseCommunity[]> {
  const candidateUrls = [
    process.env.INTERNAL_API_URL,
    'http://api:3001/api',
    getApiUrl(),
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
  ].filter(Boolean) as string[];

  const uniqueUrls = Array.from(new Set(candidateUrls));

  for (const baseUrl of uniqueUrls) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, '');
      const url = cleanBase.endsWith('/api')
        ? `${cleanBase}/communities/public/showcase`
        : `${cleanBase}/api/communities/public/showcase`;

      const res = await fetch(url, {
        next: { revalidate: 5 },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next endpoint candidate
    }
  }

  return [];
}

export default async function Home() {
  const [settings, dynamicCommunities] = await Promise.all([
    getSettings(),
    getShowcaseCommunities(),
  ]);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white relative">
      {/* Background Ornaments & Glows Container (Clipping horizontal overflows) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1500px] h-[900px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200/50 via-purple-100/30 to-transparent blur-3xl"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl"></div>
        <div className="absolute top-90 -right-40 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-2xl z-50 border-b border-slate-200/60 shadow-sm shadow-slate-900/5 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex justify-between items-center gap-2">
          <Link href="/" className="flex items-center group shrink-0">
            <img 
              src={settings['platform.logo'] || '/images/logo.svg'} 
              alt={settings['platform.name'] || 'Latih.Club'} 
              className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]" 
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/60 p-1.5 rounded-full border border-slate-200/50 backdrop-blur-md">
            <a href="#fitur" className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-5 py-2 rounded-full hover:bg-white transition-all duration-200 shadow-none hover:shadow-sm">
              Fitur Unggulan
            </a>
            <a href="#showcase" className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-5 py-2 rounded-full hover:bg-white transition-all duration-200 shadow-none hover:shadow-sm">
              Kelas Komunitas
            </a>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <a 
              href="https://wa.me/6287722125859?text=Halo%20tim%20Latih.Club,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-extrabold bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              <span>Konsultasi<span className="hidden sm:inline"> Expert</span></span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="pt-24 sm:pt-32 pb-20 sm:pb-24">
        {/* 2-Column Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto z-10 pt-2 sm:pt-6 pb-16 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Floating Pill Status */}
              <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-[10px] sm:text-xs font-extrabold text-indigo-700 shadow-sm backdrop-blur-md mb-5 sm:mb-8 max-w-full">
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-indigo-600"></span>
                </span>
                <span className="shrink-0">Latih.Club 2.0</span>
                <span className="text-indigo-300 shrink-0">•</span>
                <span className="text-slate-600 font-semibold truncate">Platform Manajemen Kelas #1</span>
              </div>

              {/* Dynamic Headline */}
              <h1 
                className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-5 sm:mb-6 leading-[1.1] sm:leading-[1.08]"
                dangerouslySetInnerHTML={{
                  __html: settings['landing.hero.headline'] || 'Ubah Audiens Anda<br />Menjadi Bisnis Kelas<br />& Aktivitas yang<br /><span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Laris Manis</span>'
                }}
              />

              {/* Subheadline */}
              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 max-w-2xl font-normal">
                {settings['landing.hero.subheadline'] || (
                  <>Platform <i>all-in-one</i> untuk membangun, mengelola, dan mengelola bisnis kelas Anda. Luncurkan microsite kustom, kelola jadwal acara dengan cerdas, atur keanggotaan berbayar, dan dapatkan analisis real-time dengan mudah.</>
                )}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto mb-10 sm:mb-14">
                <a 
                  href="https://wa.me/6287722125859?text=Halo%20tim%20Latih.Club,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold rounded-2xl text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1"
                >
                  <span>Konsultasi dengan Expert</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="#showcase" 
                  className="flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold rounded-2xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  <span>Lihat Demo Kelas</span>
                </a>
              </div>

              {/* Micro Features Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full pt-6 sm:pt-8 border-t border-slate-200/70">
                <div className="flex items-center gap-3 p-3.5 bg-white/80 rounded-2xl border border-slate-150 shadow-sm backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{settings['landing.hero.micro1.title'] || 'Mudah Digunakan'}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{settings['landing.hero.micro1.desc'] || 'Tanpa coding'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-white/80 rounded-2xl border border-slate-150 shadow-sm backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{settings['landing.hero.micro2.title'] || 'Aman & Terpercaya'}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{settings['landing.hero.micro2.desc'] || 'Data Anda terlindungi'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-white/80 rounded-2xl border border-slate-150 shadow-sm backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{settings['landing.hero.micro3.title'] || 'Analitik Real-time'}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{settings['landing.hero.micro3.desc'] || 'Data akurat & instan'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Image / Interactive Mockup */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-[3rem] blur-3xl -z-10"></div>
              
              {/* Main Card Container */}
              <div className="relative bg-white rounded-[2rem] sm:rounded-[2.5rem] p-2.5 sm:p-3 shadow-2xl shadow-indigo-950/15 border border-slate-200/80 transform hover:scale-[1.01] transition-transform duration-500">
                
                {/* Fake Browser Window */}
                <div className="bg-slate-950 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-slate-800 shadow-inner">
                  {/* Top Bar */}
                  <div className="h-9 sm:h-11 bg-slate-900/90 border-b border-slate-800 flex items-center px-3 sm:px-4 justify-between">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500"></div>
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500"></div>
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="bg-slate-800/80 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full border border-slate-700/50 text-[10px] sm:text-[11px] text-slate-300 font-mono flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-none">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">latih.club/dashboard</span>
                    </div>
                    <div className="w-8 sm:w-12"></div>
                  </div>

                  {/* Inner Mockup Image */}
                  <div className="relative overflow-hidden bg-slate-900">
                    <img 
                      src="/images/dashboard-mockup.png" 
                      alt="Dashboard Mockup" 
                      className="w-full h-auto object-cover opacity-95 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                </div>

                {/* Floating Stat Badge (Top Left Overlay) */}
                <div className="absolute -top-4 sm:-top-6 -left-2 sm:-left-6 bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Absensi Kelas</div>
                    <div className="text-[11px] sm:text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>99.8% Terverifikasi</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid Section */}
        <section id="fitur" className="py-24 px-6 lg:px-10 max-w-[1300px] mx-auto relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-extrabold text-indigo-600 uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fitur Unggulan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {settings['landing.features.headline'] || (
                <>Semua yang Anda butuhkan untuk<br />mengelola kelas, dalam satu platform.</>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Card 1: Microsite (Col 1 to 5) */}
            <div className="md:col-span-5 flex flex-col">
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200/80 shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 flex flex-col justify-between group h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100 transition-colors"></div>

                <div>
                  <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{settings['landing.features.1.title'] || 'Microsite Kelas Khusus'}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8">
                    {settings['landing.features.1.desc'] || 'Bangun rumah digital bisnis edukasi atau aktivitas Anda. Dapatkan URL unik secara instan tanpa perlu pengetahuan coding sama sekali.'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs font-extrabold text-slate-700">
                      latih.club/<span className="text-indigo-600">yourbrand</span>
                    </span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
              </div>
            </div>

            {/* Right Stack: Card 2 & Card 3 (Col 6 to 12) */}
            <div className="md:col-span-7 flex flex-col gap-8">
              {/* Card 2: Monetisasi & Membership */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200/80 shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 flex flex-col sm:flex-row items-start gap-6 group relative overflow-hidden">
                <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-900 mb-3">{settings['landing.features.2.title'] || 'Monetisasi & Membership'}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {settings['landing.features.2.desc'] || 'Buka potensi konten berbayar dengan mudah. Kelola rencana membership, kelas premium, dan kurikulum eksklusif dalam workflow yang sederhana.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">Tier Gratis</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">VIP Sesi Private</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">Paket Bundling</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Absensi & Kehadiran */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200/80 shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 flex flex-col sm:flex-row items-start gap-6 group relative overflow-hidden">
                <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-900 mb-3">{settings['landing.features.3.title'] || 'Manajemen Absensi & Kehadiran'}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {settings['landing.features.3.desc'] || 'Pantau dan kelola tingkat kehadiran peserta kelas secara real-time. Kelola check-in otomatis dan laporan absensi akurat yang bisa diunduh kapan saja.'}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 text-xs font-extrabold rounded-xl border border-amber-200/80">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>Auto Check-in & QR Verification</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Full Width Analytics Banner (Col 1 to 12) */}
            <div className="md:col-span-12">
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-indigo-500/20 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-0"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Activity className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-3">{settings['landing.features.4.title'] || 'Dashboard Analitik Real-time'}</h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                        {settings['landing.features.4.desc'] || 'Dapatkan wawasan mendalam tentang pertumbuhan bisnis Anda. Pantau peserta aktif, tren pendapatan, tingkat kehadiran kelas, hingga penggunaan konten melalui dashboard admin yang komprehensif.'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 w-full lg:w-auto">
                    <a 
                      href="https://wa.me/6287722125859?text=Halo%20tim%20Latih.Club,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm transition-all duration-300 shadow-xl hover:scale-105"
                    >
                      <span>Atur Jadwal Demo</span>
                      <ArrowRight className="w-4 h-4 text-indigo-600" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <section id="showcase" className="py-24 px-6 lg:px-10 max-w-[1400px] mx-auto relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-extrabold text-purple-600 uppercase tracking-widest mb-4">
              <Star className="w-3.5 h-3.5 fill-purple-600" />
              <span>Jelajahi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              {settings['landing.showcase.headline'] || 'Kelas & Aktivitas yang Telah Bergabung'}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl mx-auto">
              {settings['landing.showcase.subheadline'] || 'Lihat bagaimana para owner dan kreator memanfaatkan platform kami untuk menciptakan pengalaman belajar luar biasa bagi peserta mereka.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(dynamicCommunities && dynamicCommunities.length > 0
              ? dynamicCommunities.map((comm: ShowcaseCommunity): ShowcaseCardItem => ({
                  id: comm.slug,
                  name: comm.name,
                  type: comm.tagline || 'Komunitas & Kelas',
                  desc: comm.shortDescription || comm.about || 'Komunitas resmi yang aktif dalam program latihan dan sesi aktivitas bersama.',
                  image: comm.heroBanner || comm.logo || '/images/jakarta-runners.png',
                }))
              : [
                  { 
                    id: settings['landing.showcase.1.id'] || 'jakartarunners', 
                    name: settings['landing.showcase.1.name'] || 'Jakarta Runners', 
                    type: settings['landing.showcase.1.type'] || 'Komunitas Lari', 
                    desc: settings['landing.showcase.1.desc'] || 'Klub olahraga yang mengedukasi sekaligus aktif dalam penggunaan data absensi berbayar.', 
                    image: settings['landing.showcase.1.image'] || '/images/jakarta-runners.png' 
                  },
                  { 
                    id: settings['landing.showcase.2.id'] || 'tech-enthusiasts', 
                    name: settings['landing.showcase.2.name'] || 'Tech Enthusiasts', 
                    type: settings['landing.showcase.2.type'] || 'Komunitas Teknologi', 
                    desc: settings['landing.showcase.2.desc'] || 'Penyelenggara bootcamp dan kompetisi hackathon rutin untuk para developer.', 
                    image: settings['landing.showcase.2.image'] || '/images/tech-enthusiasts.png' 
                  },
                  { 
                    id: settings['landing.showcase.3.id'] || 'art-club', 
                    name: settings['landing.showcase.3.name'] || 'Art Studio Club', 
                    type: settings['landing.showcase.3.type'] || 'Studio & Kelas Seni', 
                    desc: settings['landing.showcase.3.desc'] || 'Studio kreatif yang sukses menjual berbagai paket kelas seni eksklusif.', 
                    image: settings['landing.showcase.3.image'] || '/images/art-studio.png' 
                  }
                ]
            ).map((item: ShowcaseCardItem) => (
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-200/80 overflow-hidden shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 group flex flex-col">
                <div className="h-56 overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-indigo-700 font-extrabold text-[11px] shadow-sm">
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-6">{item.desc}</p>
                  </div>

                  <Link 
                    href={`/${item.id}`} 
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors mt-auto pt-4 border-t border-slate-100"
                  >
                    <span>Kunjungi Website Microsite</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* High-Impact CTA Section */}
        <section className="py-20 px-6 lg:px-10 max-w-[1300px] mx-auto relative z-10 text-center">
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-[3rem] p-12 sm:p-20 shadow-2xl relative overflow-hidden border border-indigo-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-0"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between text-left gap-10">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-6 leading-tight">
                  {settings['landing.cta.headline'] || 'Siap Melejitkan Bisnis Kelas & Aktivitas Anda?'}
                </h2>
                <p className="text-indigo-200 text-base leading-relaxed">
                  {settings['landing.cta.subheadline'] || 'Bergabunglah dengan ratusan owner kursus dan studio yang menggunakan Latih.Club untuk membesarkan audiens mereka, mengelola event, dan menghasilkan pendapatan secara mulus.'}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center lg:items-end w-full lg:w-auto">
                <a 
                  href="https://wa.me/6287722125859?text=Halo%20tim%20Latih.Club,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 text-sm font-black rounded-2xl text-slate-900 bg-white hover:bg-indigo-50 transition-all duration-300 shadow-2xl hover:scale-105"
                >
                  <span>Konsultasi Sekarang</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <img 
              src={settings['platform.logo'] || '/images/logo.svg'} 
              alt={settings['platform.name'] || 'Latih.Club'} 
              className="h-8 sm:h-9 w-auto object-contain" 
            />
          </div>

          <div className="flex items-center space-x-8 text-xs font-bold text-slate-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Syarat & Ketentuan</a>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} {settings['platform.name'] || 'Latih.Club'}. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
