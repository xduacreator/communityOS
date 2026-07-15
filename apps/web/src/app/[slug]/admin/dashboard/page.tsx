'use client';

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../../lib/auth';
import { LayoutDashboard, Users, Wallet, Calendar, AlertCircle, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { SessionWallet } from '../../../../types';

interface DashboardStats {
  totalMembers: number;
  totalPackageBuyers: number;
  packagesBought: { name: string; count: number }[];
  expiringSoon: SessionWallet[];
  activeWallets: SessionWallet[];
  membershipRevenue: number;
  sessionRevenue: number;
  totalRevenue: number;
  dailyCheckins: { date: string; count: number }[];
}

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [communityId, setCommunityId] = useState('');

  useEffect(() => {
    const fetchCommunityId = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
        if (res.ok) {
          const data = await res.json();
          setCommunityId(data.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCommunityId();
  }, [resolvedParams.slug]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!communityId) return;
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/admin/community/${communityId}/dashboard`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [communityId]);

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500 font-bold">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-8 flex justify-center text-red-500 font-bold">Failed to load dashboard data.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Komunitas</h1>
          <p className="mt-2 text-slate-500">Ringkasan analitik finansial, keanggotaan, dan kehadiran.</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <LayoutDashboard className="w-6 h-6 text-indigo-500" />
        </div>
      </div>

      {/* Financial Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Revenue Card */}
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-indigo-200/70 uppercase tracking-wider">Total Pendapatan</p>
              <h3 className="text-2xl font-black mt-2">Rp {(stats.totalRevenue || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-300" />
            </div>
          </div>
          <p className="text-[10px] text-indigo-200/50 font-semibold mt-4">Gabungan Membership & Paket Sesi</p>
        </div>

        {/* Membership Revenue Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendapatan Membership</p>
              <h3 className="text-2xl font-black text-slate-900 mt-2">Rp {(stats.membershipRevenue || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              {stats.totalRevenue > 0 ? Math.round((stats.membershipRevenue / stats.totalRevenue) * 100) : 0}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold">kontribusi pendapatan</span>
          </div>
        </div>

        {/* Session Package Revenue Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendapatan Paket Sesi</p>
              <h3 className="text-2xl font-black text-slate-900 mt-2">Rp {(stats.sessionRevenue || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              {stats.totalRevenue > 0 ? Math.round((stats.sessionRevenue / stats.totalRevenue) * 100) : 0}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold">kontribusi pendapatan</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Stats & Expiring Sessions */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* General Stats Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-md font-bold text-slate-900 flex items-center border-b border-slate-50 pb-3">
              <Users className="w-4 h-4 mr-2 text-slate-400" />
              General Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 text-center">
                <span className="text-2xl font-black text-slate-900 block">{stats.totalMembers}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Total Member</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 text-center">
                <span className="text-2xl font-black text-slate-900 block">{stats.totalPackageBuyers}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Pembeli Paket</span>
              </div>
            </div>
          </div>

          {/* Expiring Soon Card */}
          <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm border-t-4 border-t-rose-500">
            <h2 className="text-md font-bold text-slate-900 mb-4 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-rose-500" />
              Expiring Soon (30 Hari)
            </h2>
            <div className="space-y-3">
              {stats.expiringSoon.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-6">Tidak ada sesi kedaluwarsa dekat.</p>
              ) : (
                stats.expiringSoon.map((wallet) => (
                  <div key={wallet.id} className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100/70">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-slate-900 text-xs truncate">{wallet.user?.name}</span>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        Sisa: {wallet.remainingSession} Sesi
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mt-2">
                      <span>{wallet.package?.name}</span>
                      <span className="text-rose-600">Habis: {wallet.expiredDate ? new Date(wallet.expiredDate).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Visual SVG Chart & Active Members List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Check-in SVG Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-md font-bold text-slate-900 mb-6 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-indigo-500" />
              Tren Kunjungan Harian (7 Hari Terakhir)
            </h2>
            
            <div className="flex items-end justify-between h-48 pt-6 px-4 bg-slate-50 rounded-2xl border border-slate-100/50 relative">
              {stats.dailyCheckins && stats.dailyCheckins.length > 0 ? (
                stats.dailyCheckins.map((item, idx) => {
                  const maxVal = Math.max(...stats.dailyCheckins.map(c => c.count), 5);
                  const heightPct = (item.count / maxVal) * 75; // keep padding at top
                  
                  const dateObj = new Date(item.date);
                  const label = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <span className="text-[10px] font-black text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 bg-white px-1.5 py-0.5 rounded border border-slate-250 shadow-sm pointer-events-none absolute -translate-y-12">
                        {item.count} check-in
                      </span>
                      <div 
                        style={{ height: `${Math.max(heightPct, 4)}%` }} // minimum height to show small bar
                        className={`w-6 sm:w-8 group-hover:bg-indigo-600 rounded-t-md transition-all duration-300 relative shadow-sm ${
                          item.count > 0 ? 'bg-indigo-500 shadow-indigo-500/10' : 'bg-slate-200'
                        }`}
                      >
                        {item.count > 0 && <div className="absolute inset-x-0 top-0 h-0.5 bg-white/20 rounded-t-md"></div>}
                      </div>
                      <span className="text-[9px] font-black text-slate-400 mt-2 truncate max-w-full">
                        {label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-xs font-semibold text-slate-400 py-16">
                  Tidak ada data kunjungan harian.
                </div>
              )}
            </div>
          </div>

          {/* Active Wallets Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-md font-bold text-slate-900">Member Aktif & Sisa Sesi Kelas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Member</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Paket Sesi</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Sisa / Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.activeWallets.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-xs font-bold">
                        Tidak ada member aktif saat ini.
                      </td>
                    </tr>
                  ) : (
                    stats.activeWallets.map((wallet) => (
                      <tr key={wallet.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900 text-xs">{wallet.user?.name || 'Unknown'}</div>
                          <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{wallet.user?.email || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] shadow-sm inline-block">
                            {wallet.package?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-base text-indigo-600">
                            {wallet.remainingSession}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">/ {wallet.totalSession}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
