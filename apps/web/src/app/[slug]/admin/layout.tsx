'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Users, Calendar, Settings, LogOut, ArrowLeft, Image, LayoutDashboard, Wallet, CheckSquare, Menu, X } from 'lucide-react';
import { removeToken } from '../../../lib/auth';

export default function AdminLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode,
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = React.use(params);
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: `/${resolvedParams.slug}/admin/dashboard`, icon: LayoutDashboard },
    { name: 'Members', href: `/${resolvedParams.slug}/admin`, icon: Users },
    { name: 'Pembelian', href: `/${resolvedParams.slug}/admin/wallets`, icon: Wallet },
    { name: 'Attendance', href: `/${resolvedParams.slug}/admin/attendance`, icon: CheckSquare },
    { name: 'Sessions', href: `/${resolvedParams.slug}/admin/sessions`, icon: Calendar },
    { name: 'Gallery', href: `/${resolvedParams.slug}/admin/gallery`, icon: Image },
    { name: 'Settings', href: `/${resolvedParams.slug}/admin/settings`, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - One UI Style */}
      <aside className={`w-72 bg-white grid grid-rows-[auto_1fr_auto] fixed top-0 left-0 h-[100dvh] z-40 border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-50 relative">
          {/* Mobile Close Button */}
          <button 
            className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mr-3">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Admin Panel</span>
        </div>

        <div className="p-6 border-b border-slate-50 space-y-2">
          <Link 
            href={`/${resolvedParams.slug}`}
            className="flex items-center w-full px-4 py-4 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold rounded-2xl transition-colors group"
          >
            <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 mr-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[15px]">View Site</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-4 text-slate-500 hover:bg-red-50 hover:text-red-600 font-semibold rounded-2xl transition-colors group"
          >
            <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500 mr-3 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-[15px]">Logout</span>
          </button>
        </div>
        
        <div className="overflow-y-auto">
          <div className="py-8 px-6 space-y-2">
            <div className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
              Manage /{resolvedParams.slug}
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-4 rounded-2xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50 font-semibold hover:text-slate-900'
                  }`}
                >
                  <div className={`p-2 rounded-xl mr-3 transition-colors ${
                    isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                  }`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[15px]">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>


      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center md:hidden">
            <button 
              className="p-2 mr-3 bg-white rounded-xl shadow-sm border border-slate-200/60 text-slate-700"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          
          <div className="flex items-center ml-auto space-x-4">
            <div className="flex items-center bg-slate-50 pl-2 pr-4 py-2 rounded-[2rem] border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                A
              </div>
              <span className="ml-3 text-sm font-bold text-slate-700 hidden sm:block">Community Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 md:p-10 bg-slate-50/50 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
