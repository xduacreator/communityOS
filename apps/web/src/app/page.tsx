/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Globe, Layers, Users, Zap, QrCode, CreditCard, ChevronRight, Activity, Smartphone, Play, CheckCircle2, ShieldCheck, BarChart3, ChevronLeft } from "lucide-react";

async function getSettings() {
  try {
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/system-settings', { next: { revalidate: 5 } });
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    return {};
  }
}

export default async function Home() {
  const settings = await getSettings();
  
  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-indigo-50/80 to-transparent -z-10 pointer-events-none"></div>
      
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-[14px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CommunityOS</h1>
          </div>
          <nav className="hidden md:flex flex-1 justify-center">
            <ul className="flex items-center space-x-10">
              <li><a href="#fitur" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Fitur</a></li>
              <li><a href="#showcase" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Kelas Komunitas</a></li>
            </ul>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hidden md:block text-sm font-bold text-slate-700 px-6 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors">
              Masuk
            </Link>
            <a href="https://wa.me/6287722125859?text=Halo%20tim%20CommunityOS,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" target="_blank" rel="noopener noreferrer" className="text-sm font-bold bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">
              Konsultasi dengan Expert
            </a>
          </div>
        </div>
      </header>
 
      <main className="pt-32 pb-20">
        {/* 2-Column Hero Section */}
        <section className="relative px-6 lg:px-8 max-w-[1400px] mx-auto z-10 pt-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50/50 border border-indigo-100 text-xs font-bold text-indigo-700 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                </span>
                CommunityOS 1.0 <span className="mx-2 text-indigo-300">•</span> Telah Hadir!
              </div>
              
              <h2 
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.1]"
                dangerouslySetInnerHTML={{
                  __html: settings['landing.hero.headline'] || 'Ubah Audiens Anda<br />Menjadi Bisnis Kelas<br />& Aktivitas yang<br /><span className="text-indigo-600">Laris Manis</span>'
                }}
              />
              
              <p className="text-base md:text-lg text-slate-500 mb-10 leading-relaxed max-w-xl">
                {settings['landing.hero.subheadline'] || (
                  <>Platform <i>all-in-one</i> untuk membangun, mengelola, dan mengelola bisnis kelas Anda. Luncurkan microsite kustom, kelola jadwal acara dengan cerdas, atur keanggotaan/kelas berbayar, dan dapatkan analisis real-time dengan mudah.</>
                )}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
                <a href="https://wa.me/6287722125859?text=Halo%20tim%20CommunityOS,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5">
                  Konsultasi dengan Expert kami <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a href="#showcase" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-sm font-bold rounded-full text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm hover:-translate-y-0.5">
                  Lihat Demo <Play className="w-4 h-4 ml-2 fill-current" />
                </a>
              </div>

              {/* Micro Features Row */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 border-t border-slate-200/60 pt-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{settings['landing.hero.micro1.title'] || 'Mudah Digunakan'}</div>
                    <div className="text-xs text-slate-500">{settings['landing.hero.micro1.desc'] || 'Tanpa coding'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{settings['landing.hero.micro2.title'] || 'Aman & Terpercaya'}</div>
                    <div className="text-xs text-slate-500">{settings['landing.hero.micro2.desc'] || 'Data Anda terlindungi'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{settings['landing.hero.micro3.title'] || 'Analitik Real-time'}</div>
                    <div className="text-xs text-slate-500">{settings['landing.hero.micro3.desc'] || 'Data akurat & instan'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image Mockup */}
            <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-violet-50 rounded-[3rem] blur-3xl -z-10 opacity-60"></div>
              <div className="bg-white p-2 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 transform rotate-1 hover:rotate-0 transition-transform duration-700">
                <div className="bg-slate-50 rounded-[1.5rem] border border-slate-100 overflow-hidden relative">
                  {/* Fake Browser Chrome */}
                  <div className="h-10 border-b border-slate-200 bg-white/50 flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <div className="mx-auto w-1/2 h-5 bg-slate-100 rounded-md"></div>
                  </div>
                  <img src="/images/dashboard-mockup.png" alt="Dashboard" className="w-full h-auto object-cover opacity-95" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="fitur" className="py-24 px-6 lg:px-8 max-w-[1200px] mx-auto relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h3 className="text-indigo-600 font-bold tracking-widest uppercase text-xs mb-4">FITUR UNGGULAN</h3>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              {settings['landing.features.headline'] || (
                <>Semua yang Anda butuhkan untuk<br />mengelola kelas, dalam satu platform.</>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Big Column */}
            <div className="md:col-span-5 flex flex-col">
              <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden group">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 shrink-0 relative z-10">
                  <Globe className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4 relative z-10">{settings['landing.features.1.title'] || 'Microsite Kelas Khusus'}</h4>
                <p className="text-slate-500 leading-relaxed text-sm relative z-10 mb-10 flex-1">
                  {settings['landing.features.1.desc'] || 'Bangun rumah digital bisnis edukasi atau aktivitas Anda. Dapatkan URL unik secara instan tanpa perlu pengetahuan coding sama sekali.'}
                </p>
                <div className="relative z-10 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="font-mono text-sm font-semibold text-slate-600">communityos.app/<span className="text-indigo-600">yourbrand</span></div>
                  </div>
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Right Side Stack */}
            <div className="md:col-span-7 flex flex-col gap-6">
              {/* Top Right */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex items-start gap-6 relative overflow-hidden group h-full">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20 relative z-10">
                  <Users className="w-6 h-6" />
                </div>
                <div className="relative z-10 flex-1 py-1">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{settings['landing.features.2.title'] || 'Monetisasi & Membership'}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {settings['landing.features.2.desc'] || 'Buka potensi konten berbayar dengan mudah. Kelola rencana membership, kelas premium, dan kurikulum eksklusif dalam workflow yang sederhana.'}
                  </p>
                </div>
              </div>

              {/* Bottom Right */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex items-start gap-6 relative overflow-hidden group h-full">
                <div className="w-14 h-14 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 relative z-10">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="relative z-10 flex-1 py-1">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{settings['landing.features.3.title'] || 'Manajemen Absensi & Kehadiran'}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {settings['landing.features.3.desc'] || 'Pantau dan kelola tingkat kehadiran peserta kelas secara real-time. Kelola check-in otomatis dan laporan absensi akurat yang bisa diunduh kapan saja.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Full Width */}
            <div className="md:col-span-12">
              <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <Activity className="w-8 h-8" />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{settings['landing.features.4.title'] || 'Dashboard Analitik Real-time'}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
                    {settings['landing.features.4.desc'] || 'Dapatkan wawasan mendalam tentang pertumbuhan bisnis Anda. Pantau peserta aktif, tren pendapatan, tingkat kehadiran kelas, hingga penggunaan konten melalui dashboard admin yang komprehensif.'}
                  </p>
                </div>
                <div className="relative z-10 shrink-0 mt-4 md:mt-0">
                  <a href="https://wa.me/6287722125859?text=Halo%20tim%20CommunityOS,%20saya%20ingin%20konsultasi%20mengenai%20platform%20ini" target="_blank" rel="noopener noreferrer" className="flex items-center px-6 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    Atur Jadwal Demo <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase / Demo Section */}
        <section id="showcase" className="py-24 px-6 lg:px-8 max-w-[1400px] mx-auto relative z-10">
           <div className="text-center mb-16 max-w-3xl mx-auto">
            <h3 className="text-indigo-600 font-bold tracking-widest uppercase text-xs mb-4">JELAJAHI</h3>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-6">
              {settings['landing.showcase.headline'] || 'Kelas & Aktivitas yang Telah Bergabung'}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
              {settings['landing.showcase.subheadline'] || 'Lihat bagaimana para owner dan kreator memanfaatkan platform kami untuk menciptakan pengalaman belajar luar biasa bagi peserta mereka.'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="hidden md:flex w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
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
              ].map((community) => (
                <div key={community.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <img src={community.image} alt={community.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-[10px] font-bold text-blue-600 mb-4 w-max">
                      {community.type}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-3">{community.name}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6 flex-1">{community.desc}</p>
                    
                    <Link href={`/${community.id}`} className="flex items-center text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mt-auto">
                      Kunjungi Website <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <button className="hidden md:flex w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm shrink-0">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 lg:px-8 max-w-[1200px] mx-auto relative z-10 text-center">
          <div className="bg-[#1e1b4b] rounded-[3rem] p-16 md:p-24 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-900 opacity-90"></div>
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.2),transparent_50%)]"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between text-left gap-10">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
                  {settings['landing.cta.headline'] || 'Siap Melejitkan Bisnis Kelas & Aktivitas Anda?'}
                </h2>
                <p className="text-indigo-200 text-sm md:text-base max-w-xl leading-relaxed">
                  {settings['landing.cta.subheadline'] || 'Bergabunglah dengan ratusan owner kursus dan studio yang menggunakan CommunityOS untuk membesarkan audiens mereka, mengelola event, dan menghasilkan pendapatan secara mulus.'}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-center">
                <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold rounded-full text-slate-900 bg-white hover:bg-indigo-50 transition-all shadow-xl hover:scale-105 active:scale-95 mb-3">
                  Buka Kelas Anda Sekarang <ArrowRight className="w-4 h-4 ml-2 text-slate-400" />
                </Link>
                <div className="text-[10px] text-indigo-300 font-medium tracking-wide uppercase">
                  Gratis 14 hari - Tanpa kartu kredit
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer minimal */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">CommunityOS</span>
          </div>
          
          <div className="flex items-center gap-8 text-xs font-medium text-slate-500">

            <a href="#" className="hover:text-indigo-600 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Syarat & Ketentuan</a>
          </div>

          <p className="text-xs text-slate-400">© 2026 CommunityOS. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
