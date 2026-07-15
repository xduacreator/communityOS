'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Search,
  Plus,
  QrCode
} from 'lucide-react';
import { getAuthHeaders } from '../../../lib/auth';
import { SessionPackage, SessionTransaction } from '../../../types';

interface SuperAdminStats {
  todaysCheckins: number;
  activeWalletsCount: number;
  packagesSoldMtd: number;
  revenueMtd: number;
  expiredFrozenCount: number;
}

export default function SessionsManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [attendances, setAttendances] = useState<SessionTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders();
        const [statsRes, pkgsRes, attRes] = await Promise.all([
          fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/session-wallet/superadmin/dashboard', { headers }),
          fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/session-package/superadmin/all', { headers }),
          fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/session-wallet/superadmin/attendance', { headers })
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (pkgsRes.ok) setPackages(await pkgsRes.json());
        if (attRes.ok) setAttendances(await attRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const statCards = [
    { title: "Today's Check-ins", value: stats?.todaysCheckins || 0, subtitle: "All communities", icon: CheckCircle2, color: "from-emerald-500 to-teal-400" },
    { title: "Active Wallets", value: stats?.activeWalletsCount || 0, subtitle: "Globally active", icon: CreditCard, color: "from-blue-600 to-cyan-500" },
    { title: "Packages Sold (Mtd)", value: stats?.packagesSoldMtd || 0, subtitle: `Revenue: ${formatRupiah(stats?.revenueMtd || 0)}`, icon: Activity, color: "from-violet-600 to-purple-500" },
    { title: "Expired / Frozen", value: stats?.expiredFrozenCount || 0, subtitle: "Requires attention", icon: Clock, color: "from-rose-500 to-orange-400" }
  ];

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-bold">Loading session data...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header - One UI Style: Large and Bold */}
      <div className="pt-4 pb-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">Sessions & Packages</h1>
        <p className="text-lg text-slate-500 font-medium">Manage activities, session wallets, and attendances globally.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {['overview', 'packages', 'checkin'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === tab 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/60'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-100/50 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg opacity-90`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-500 font-bold text-sm mb-1">{stat.title}</h3>
                  <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">{stat.value}</div>
                  <div className="text-sm font-semibold text-slate-400">{stat.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100/50 col-span-1">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <button className="w-full flex items-center p-4 rounded-3xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-bold group">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-200/50 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  Scan Check-in
                </button>
                <button className="w-full flex items-center p-4 rounded-3xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold group">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-200/50 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  Sell Package
                </button>
                <button className="w-full flex items-center p-4 rounded-3xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-bold group">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200/50 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  Freeze Wallet
                </button>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100/50 col-span-1 lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-slate-900">Live Attendances</h2>
              </div>
              
              <div className="space-y-5">
                {attendances.length === 0 ? (
                  <p className="text-slate-500 font-bold text-center py-4">No recent check-ins.</p>
                ) : (
                  attendances.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 mr-4">
                          {record.wallet?.user?.name ? record.wallet.user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-lg">{record.wallet?.user?.name || 'Unknown'}</div>
                          <div className="text-sm font-semibold text-slate-400">
                            {record.wallet?.package?.name} (Session {record.afterSession}/{record.wallet?.totalSession})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl text-sm">Success</div>
                        <div className="text-xs font-semibold text-slate-400 mt-1">
                          {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packages Tab Content */}
      {activeTab === 'packages' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Session Packages</h2>
              <p className="text-slate-500 font-medium">Manage all available packages for sale across communities.</p>
            </div>
            <button className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
              <Plus className="w-5 h-5 mr-2" />
              New Package
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Package Name</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Activity (Community)</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Sessions</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Valid Days</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Price (Reg / VIP)</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">No packages found.</td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 font-bold text-slate-900">{pkg.name}</td>
                      <td className="py-5">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-sm font-bold">
                          {pkg.category?.activity?.name || 'Unknown'} 
                          <span className="text-xs text-slate-400 ml-1">({pkg.category?.activity?.community?.name})</span>
                        </span>
                      </td>
                      <td className="py-5 font-bold text-slate-600">{pkg.totalSession}</td>
                      <td className="py-5 font-bold text-slate-600">{pkg.validDays}</td>
                      <td className="py-5">
                        <div className="font-bold text-slate-900">{formatRupiah(pkg.memberPrice)}</div>
                        {pkg.vipPrice && <div className="text-sm font-bold text-amber-500">{formatRupiah(pkg.vipPrice)}</div>}
                      </td>
                      <td className="py-5 text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 font-bold px-4 py-2 hover:bg-indigo-50 rounded-xl transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Check-in Tab */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100/50 flex flex-col items-center justify-center py-24">
           <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6">
             <QrCode className="w-12 h-12 text-indigo-500" />
           </div>
           <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Manual Check-in</h2>
           <p className="text-slate-500 font-medium mb-8 text-center max-w-md">Search for a member or scan their QR code to deduct a session from their active wallet.</p>
           
           <div className="flex w-full max-w-lg relative">
             <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Enter Member Name or ID..." 
               className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-medium text-lg outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
             />
             <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 shadow-md">
               Search
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
