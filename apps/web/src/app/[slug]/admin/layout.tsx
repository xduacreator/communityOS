'use client';
import { getApiUrl } from '../../../lib/api';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wallet,
  UserPlus,
  Package,
  ClipboardCheck,
  History,
  CalendarDays,
  Image,
  Ticket,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { removeToken, getAuthHeaders } from '../../../lib/auth';
import { outfit } from '../../../lib/fonts';
import { initials } from '../../../lib/club';
import { adminThemeStyle } from '../../../components/admin/AdminUI';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const ADMIN_NAV: NavGroup[] = [
  { items: [{ name: 'Ringkasan', path: '/dashboard', icon: LayoutDashboard }] },
  {
    title: 'Member',
    items: [
      { name: 'Daftar Member', path: '', icon: Users },
      { name: 'Pembelian', path: '/wallets', icon: Wallet },
      { name: 'Pendaftar Tamu', path: '/sessions/guests', icon: UserPlus },
    ],
  },
  {
    title: 'Latihan',
    items: [
      { name: 'Paket & Sesi', path: '/sessions', icon: Package },
      { name: 'Check-in Peserta', path: '/participants', icon: ClipboardCheck },
      { name: 'Riwayat Absensi', path: '/attendance', icon: History },
    ],
  },
  {
    title: 'Konten Klub',
    items: [
      { name: 'Event', path: '/events', icon: CalendarDays },
      { name: 'Galeri', path: '/gallery', icon: Image },
      { name: 'Voucher & Promo', path: '/vouchers', icon: Ticket },
    ],
  },
  { title: 'Pengaturan', items: [{ name: 'Pengaturan Klub', path: '/settings', icon: Settings }] },
];

const COACH_NAV: NavGroup[] = [
  {
    items: [
      { name: 'Check-in Peserta', path: '/participants', icon: ClipboardCheck },
      { name: 'Riwayat Absensi', path: '/attendance', icon: History },
    ],
  },
];

interface ClubInfo {
  name: string;
  logo?: string | null;
}

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = React.use(params);
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [panelRole, setPanelRole] = useState<'COMMUNITY_ADMIN' | 'COACH'>('COMMUNITY_ADMIN');
  const [userName, setUserName] = useState('');
  const [club, setClub] = useState<ClubInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsAuthorized(false); // Reset authorized state when community slug changes
    const checkAuth = async () => {
      const headers = getAuthHeaders();
      try {
        const userRes = await fetch(`${getApiUrl()}/auth/me`, { headers: { ...headers } });
        if (!userRes.ok) throw new Error('Unauthorized');
        const userData = await userRes.json();
        if (isMounted) setUserName(userData.name || '');

        if (userData.isSuperAdmin) {
          if (isMounted) {
            setPanelRole('COMMUNITY_ADMIN');
            setIsAuthorized(true);
          }
          return;
        }

        const memRes = await fetch(`${getApiUrl()}/memberships/my-status/${resolvedParams.slug}`, { headers: { ...headers } });
        if (!memRes.ok) {
          router.push(`/${resolvedParams.slug}/dashboard`);
          return;
        }

        const memData = await memRes.json();
        if (memData && memData.status === 'APPROVED' && memData.role === 'COMMUNITY_ADMIN') {
          if (isMounted) {
            setPanelRole('COMMUNITY_ADMIN');
            setIsAuthorized(true);
          }
        } else if (memData && memData.status === 'APPROVED' && memData.role === 'COACH') {
          const coachPaths = [
            `/${resolvedParams.slug}/admin/participants`,
            `/${resolvedParams.slug}/admin/attendance`,
          ];
          if (!coachPaths.includes(pathname)) {
            router.replace(`/${resolvedParams.slug}/admin/participants`);
            return;
          }
          if (isMounted) {
            setPanelRole('COACH');
            setIsAuthorized(true);
          }
        } else {
          router.push(`/${resolvedParams.slug}/dashboard`);
        }
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug, pathname, router]);

  // Club name and logo for the sidebar
  useEffect(() => {
    let isMounted = true;
    fetch(`${getApiUrl()}/communities/${resolvedParams.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) setClub({ name: data.name, logo: data.logo });
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug]);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const shell = `${outfit.className} min-h-screen bg-[#F6F6F2] text-[#111214]`;

  if (!isAuthorized) {
    return (
      <div className={`${shell} flex items-center justify-center`} style={adminThemeStyle}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#E6E6E0] border-t-[#111214]" />
          <div className="text-sm font-semibold text-[#55585E]">Memeriksa akses…</div>
        </div>
      </div>
    );
  }

  const base = `/${resolvedParams.slug}/admin`;
  const groups = panelRole === 'COACH' ? COACH_NAV : ADMIN_NAV;
  const isActive = (path: string) => {
    const href = base + path;
    if (pathname === href) return true;
    // Sub-pages (create/detail) keep their section highlighted, except the
    // guest list, which has its own entry under /sessions
    if (path === '' || path === '/sessions') return false;
    return pathname?.startsWith(`${href}/`) ?? false;
  };
  const clubName = club?.name || resolvedParams.slug;
  const roleLabel = panelRole === 'COACH' ? 'Panel coach' : 'Panel admin';

  const clubMark = (size: number) => (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#111214] font-extrabold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {club?.logo ? <img src={club.logo} alt="" className="h-full w-full object-cover" /> : initials(clubName)}
    </span>
  );

  return (
    <div className={`${shell} flex`} style={adminThemeStyle}>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-[#111214]/40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-[100dvh] w-[264px] flex-col border-r border-[#E6E6E0] bg-white transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-[#EEEEE8] px-5 py-4">
          {clubMark(40)}
          <div className="flex min-w-0 flex-1 flex-col">
            <b className="truncate text-[15px] leading-tight">{clubName}</b>
            <span className="text-xs font-semibold text-[#8A8C90]">{roleLabel}</span>
          </div>
          <button
            className="rounded-full bg-[#F1F1EC] p-2 text-[#55585E] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu admin">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.title && (
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8C90]">{group.title}</div>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={base + item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] transition-colors ${
                        active ? 'bg-[#111214] font-bold text-white' : 'font-semibold text-[#3A3C40] hover:bg-[#F1F1EC]'
                      }`}
                    >
                      <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-[#8A8C90]'}`} strokeWidth={2.1} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-0.5 border-t border-[#EEEEE8] px-3 py-3">
          <a
            href={`/${resolvedParams.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold text-[#3A3C40] hover:bg-[#F1F1EC]"
          >
            <ExternalLink className="h-[18px] w-[18px] text-[#8A8C90]" strokeWidth={2.1} />
            Lihat halaman klub
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] font-semibold text-[#3A3C40] hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px] text-[#8A8C90]" strokeWidth={2.1} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-h-screen w-full min-w-0 flex-1 flex-col md:ml-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#E6E6E0] bg-[#F6F6F2]/90 px-4 backdrop-blur-md sm:px-8">
          <button
            className="rounded-xl border border-[#E6E6E0] bg-white p-2 text-[#111214] md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2.5 md:hidden">
            {clubMark(32)}
            <b className="truncate text-[15px]">{clubName}</b>
          </div>
          <div className="ml-auto flex items-center gap-2.5 rounded-full border border-[#E6E6E0] bg-white py-1.5 pl-1.5 pr-1.5 sm:pr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111214] text-xs font-bold text-white">
              {initials(userName || (panelRole === 'COACH' ? 'Coach' : 'Admin'))}
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <b className="max-w-[180px] truncate text-sm">{userName || 'Pengurus'}</b>
              <span className="text-[11px] font-semibold text-[#8A8C90]">{panelRole === 'COACH' ? 'Coach' : 'Admin klub'}</span>
            </span>
          </div>
        </header>

        <div className="w-full min-w-0 flex-1 p-4 sm:p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
