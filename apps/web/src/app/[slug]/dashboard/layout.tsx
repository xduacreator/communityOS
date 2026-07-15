'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Settings, LogOut, ArrowLeft, Shield } from 'lucide-react';
import { removeToken } from '../../../lib/auth';

import React from 'react';

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
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
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
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center md:hidden">
            <Shield className="w-6 h-6 text-indigo-600 mr-2" />
            <span className="font-bold text-slate-900">Member</span>
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
        <div className="flex-1 p-6 sm:p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
