'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Settings, LogOut, ArrowLeft, Shield, Menu, X } from 'lucide-react';
import { removeToken } from '../../../lib/auth';

export default function MemberLayout({ 
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
    router.push(`/${resolvedParams.slug}`);
  };

  const navItems = [
    { name: 'My Dashboard', href: `/${resolvedParams.slug}/dashboard`, icon: LayoutDashboard },
    { name: 'My Events', href: `/${resolvedParams.slug}/dashboard/events`, icon: Calendar },
    { name: 'Settings', href: `/${resolvedParams.slug}/dashboard/settings`, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-40 transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 relative">
          {/* Mobile Close Button */}
          <button 
            className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 md:hidden hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          <Shield className="w-6 h-6 text-cyan-400 mr-2" />
          <span className="text-lg font-bold tracking-tight">Member Area</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <div className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            /{resolvedParams.slug}
          </div>
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                pathname === item.href 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${pathname === item.href ? 'text-indigo-200' : ''}`} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link 
            href={`/${resolvedParams.slug}`}
            className="flex items-center w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">View Community</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-red-400 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center md:hidden">
            <button 
              className="p-2 mr-3 bg-slate-100 rounded-xl text-slate-700"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Shield className="w-6 h-6 text-indigo-600 mr-2" />
          </div>
          
          <div className="flex items-center ml-auto space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                U
              </div>
              <span className="ml-2 text-sm font-medium text-slate-700 hidden sm:block">Member User</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 bg-slate-50 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
