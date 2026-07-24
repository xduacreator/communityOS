'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Globe, Users, LogOut, LayoutGrid, Fingerprint, Settings, Menu, X } from 'lucide-react';
import { removeToken } from '../../lib/auth';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const navItems = [
    { name: 'Communities', href: '/super-admin', icon: Globe },
    { name: 'Users & Roles', href: '/super-admin/users', icon: Fingerprint },
    { name: 'Global Members', href: '/super-admin/members', icon: Users },
    { name: 'Sessions', href: '/super-admin/sessions', icon: LayoutGrid },
    { name: 'Settings', href: '/super-admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans selection:bg-indigo-500/30">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - One UI Style (Floating / Bubbly) */}
      <aside className={`w-[280px] grid grid-rows-[auto_1fr_auto] fixed top-0 left-0 h-[100dvh] p-4 md:p-6 z-40 transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 h-full grid grid-rows-[auto_1fr_auto] border border-slate-100/50 overflow-hidden relative">
          {/* Mobile Close Button */}
          <button 
            className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="h-24 flex items-center px-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mr-3">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Console</span>
          </div>

          <div className="overflow-y-auto">
            <div className="px-4 py-4 space-y-2">
              <div className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Super Admin Menu
              </div>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-5 py-4 rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 font-bold' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-[15px]">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-5 py-4 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-300 font-medium group"
            >
              <LogOut className="w-5 h-5 mr-4 text-slate-400 group-hover:text-red-500 transition-colors" />
              <span className="text-[15px]">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] flex flex-col min-h-screen relative w-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 md:h-24 flex items-center justify-between px-4 sm:px-8 md:px-12 sticky top-0 z-10 bg-slate-100/80 backdrop-blur-xl">
          <div className="flex items-center md:hidden">
            <button 
              className="p-2 mr-3 bg-white rounded-xl shadow-sm border border-slate-200/60 text-slate-700"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="flex items-center ml-auto space-x-4">
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
              <span className="mr-3 text-sm font-bold text-slate-700 hidden sm:block">Super Admin</span>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - One UI Viewing Area */}
        <div className="flex-1 px-4 sm:px-8 md:px-12 pb-12 pt-4 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
