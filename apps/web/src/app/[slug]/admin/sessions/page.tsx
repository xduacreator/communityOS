'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Search,
  Plus,
  QrCode,
  X
} from 'lucide-react';
import { getAuthHeaders } from '../../../../lib/auth';
import { Community, SessionPackage, Activity as CommunityActivity, SessionWallet, CommunityMember } from '../../../../types';

export default function SessionsManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [wallets, setWallets] = useState<SessionWallet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPackageId, setEditPackageId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    activityMode: 'select', // 'select' or 'new'
    activityId: '', 
    activityName: '',
    categoryMode: 'select', // 'select' or 'new'
    categoryId: '', 
    categoryName: '',
    name: '',
    description: '',
    image: '',
    totalSession: 1,
    validDays: 30,
    memberPrice: 0,
    vipPrice: 0,
    quota: '',
    privateQuota: '',
    accessRule: 'PUBLIC',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.slug]);

  const fetchData = async () => {
    try {
      const commRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
      if (!commRes.ok) throw new Error('Community not found');
      const comm = await commRes.json();
      setCommunity(comm);

      await Promise.all([
        fetchPackages(comm.id),
        fetchActivities(comm.id),
        fetchMembers(comm.id),
        fetchWallets(comm.id)
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (commId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/memberships/community/${commId}`, { headers });
      if (res.ok) setMembers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchWallets = async (commId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/admin/community/${commId}/wallets`, { headers });
      if (res.ok) setWallets(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPackages = async (commId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-package/community/${commId}`);
      if (res.ok) setPackages(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchActivities = async (commId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/activity?communityId=${commId}`);
      if (res.ok) setActivities(await res.json());
    } catch (e) { console.error(e); }
  };

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    setSubmitting(true);
    
    try {
      const headers = getAuthHeaders();
      let actId = formData.activityMode === 'select' ? formData.activityId : null;
      let catId = formData.categoryMode === 'select' ? formData.categoryId : null;

      // 1. Create Activity if new
      if (formData.activityMode === 'new' && formData.activityName) {
        const actRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ name: formData.activityName, communityId: community.id })
        });
        if (!actRes.ok) throw new Error('Failed to create Activity');
        const actData = await actRes.json();
        actId = actData.id;
      }

      // 2. Create Category if new
      if ((formData.categoryMode === 'new' || formData.activityMode === 'new') && formData.categoryName && actId) {
        const catRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/activity/category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ name: formData.categoryName, activityId: actId })
        });
        if (!catRes.ok) throw new Error('Failed to create Category');
        const catData = await catRes.json();
        catId = catData.id;
      }

      if (!catId) throw new Error('Category ID is missing. Please select or create a category.');

      // 3. Handle Image Upload
      let finalImageUrl = formData.image;
      if (imageFile) {
        finalImageUrl = await uploadFile(imageFile);
      }

      // 4. Create or Update Session Package
      const url = editPackageId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-package/${editPackageId}`
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/session-package';
      
      const method = editPackageId ? 'PATCH' : 'POST';

      const pkgRes = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          categoryId: catId,
          name: formData.name,
          description: formData.description || null,
          image: finalImageUrl || null,
          totalSession: Number(formData.totalSession),
          validDays: Number(formData.validDays),
          memberPrice: Number(formData.memberPrice),
          vipPrice: formData.vipPrice ? Number(formData.vipPrice) : null,
          quota: formData.quota ? Number(formData.quota) : null,
          privateQuota: formData.privateQuota ? Number(formData.privateQuota) : null,
          accessRule: formData.accessRule
        })
      });

      if (!pkgRes.ok) throw new Error(`Failed to ${editPackageId ? 'update' : 'create'} Session Package`);

      // Success
      setIsModalOpen(false);
      setEditPackageId(null);
      setImageFile(null);
      setFormData({
        activityMode: 'select', activityId: '', activityName: '',
        categoryMode: 'select', categoryId: '', categoryName: '',
        name: '', description: '', image: '', totalSession: 1, validDays: 30, memberPrice: 0, vipPrice: 0,
        quota: '', privateQuota: '', accessRule: 'PUBLIC',
      });
      if (pkgRes.ok) {
        setIsModalOpen(false);
        fetchPackages(community.id);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const [checkinForm, setCheckinForm] = useState({ userId: '', packageId: '', remarks: '' });
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !checkinForm.userId) return;
    setCheckinSubmitting(true);
    try {
      const headers = getAuthHeaders();
      // Admin checkIn needs adminId. But backend infers it from token if we use a specific endpoint?
      // Wait, our backend endpoint `/session-wallet/check-in` takes `adminId` from body.
      // But we can just use the user ID from the token via decoding or sending a placeholder, 
      // wait, we have `getAuthHeaders()` but `adminId` is required.
      // Let's decode token or just let backend handle it?
      const adminId = JSON.parse(atob(headers.Authorization.split('.')[1])).sub || '';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          userId: checkinForm.userId,
          communityId: community.id,
          adminId: adminId,
          packageId: checkinForm.packageId || undefined,
          remarks: checkinForm.remarks || 'Manual Check-in via Admin',
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to check in');
      }
      
      alert('Check-in successful!');
      setCheckinForm({ userId: '', packageId: '', remarks: '' });
      fetchWallets(community.id); // Refresh wallets
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error checking in');
    } finally {
      setCheckinSubmitting(false);
    }
  };

  const handleEditPackage = (pkg: SessionPackage) => {
    setEditPackageId(pkg.id);
    setImageFile(null);
    setFormData({
      activityMode: 'select',
      activityId: pkg.category?.activityId || '',
      activityName: '',
      categoryMode: 'select',
      categoryId: pkg.categoryId || '',
      categoryName: '',
      name: pkg.name || '',
      description: pkg.description || '',
      image: pkg.image || '',
      totalSession: pkg.totalSession || 1,
      validDays: pkg.validDays || 30,
      memberPrice: pkg.memberPrice || 0,
      vipPrice: pkg.vipPrice || 0,
      quota: pkg.quota?.toString() || '',
      privateQuota: pkg.privateQuota?.toString() || '',
      accessRule: pkg.accessRule || 'PUBLIC',
    });
    setIsModalOpen(true);
  };

  const stats = [
    { title: "Today's Check-ins", value: "0", subtitle: "Pending integration", icon: CheckCircle2, color: "from-emerald-500 to-teal-400" },
    { title: "Active Wallets", value: "0", subtitle: "Pending integration", icon: CreditCard, color: "from-blue-600 to-cyan-500" },
    { title: "Packages Available", value: packages.length.toString(), subtitle: "Active", icon: Activity, color: "from-violet-600 to-purple-500" },
    { title: "Expired / Frozen", value: "0", subtitle: "Requires attention", icon: Clock, color: "from-rose-500 to-orange-400" }
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const selectedActivity = activities.find(a => a.id === formData.activityId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header - One UI Style: Large and Bold */}
      <div className="pt-4 pb-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">Sessions & Packages</h1>
        <p className="text-lg text-slate-500 font-medium">Manage activities, session wallets, and attendances globally.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {['overview', 'packages', 'wallets', 'quick actions'].map((tab) => (
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
            {stats.map((stat, i) => (
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
                <h2 className="text-2xl font-extrabold text-slate-900">Live Attendances (WIP)</h2>
              </div>
              <div className="py-12 text-center text-slate-400 font-medium bg-slate-50 rounded-3xl border border-slate-100">
                No recent check-ins found.
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
              <p className="text-slate-500 font-medium">Manage all available packages for sale.</p>
            </div>
            <button 
              onClick={() => {
                setEditPackageId(null);
                setImageFile(null);
                setFormData({
                  activityMode: 'select', activityId: '', activityName: '',
                  categoryMode: 'select', categoryId: '', categoryName: '',
                  name: '', description: '', image: '', totalSession: 1, validDays: 30, memberPrice: 0, vipPrice: 0,
                  quota: '', privateQuota: '', accessRule: 'PUBLIC',
                });
                setIsModalOpen(true);
              }}
              className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Package
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Package Name</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Activity</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Sessions</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Valid Days</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100">Price (Reg / Private)</th>
                  <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {packages.length > 0 ? packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 font-bold text-slate-900">{pkg.name}</td>
                    <td className="py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-sm font-bold">
                        {pkg.category?.activity?.name || pkg.activity?.name || 'Activity'} • {pkg.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-5 font-bold text-slate-600">{pkg.totalSession}</td>
                    <td className="py-5 font-bold text-slate-600">{pkg.validDays}</td>
                    <td className="py-5">
                      <div className="font-bold text-slate-900">Rp {pkg.memberPrice?.toLocaleString('id-ID') || 0}</div>
                      {pkg.vipPrice ? (
                        <div className="text-sm font-bold text-amber-500">Private: Rp {pkg.vipPrice.toLocaleString('id-ID')}</div>
                      ) : null}
                    </td>
                    <td className="py-5 text-right">
                      <button 
                        onClick={() => handleEditPackage(pkg)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold px-4 py-2 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No packages found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions Tab */}
      {activeTab === 'quick actions' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100/50 flex flex-col items-center justify-center py-16">
           <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6">
             <QrCode className="w-12 h-12 text-indigo-500" />
           </div>
           <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Manual Check-in</h2>
           <p className="text-slate-500 font-medium mb-8 text-center max-w-md">Select a member to manually deduct a session from their active wallet.</p>
           
           <form onSubmit={handleManualCheckIn} className="w-full max-w-lg space-y-4">
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Select Member</label>
               <select
                 required
                 value={checkinForm.userId}
                 onChange={(e) => setCheckinForm({ ...checkinForm, userId: e.target.value })}
                 className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 transition-all outline-none"
               >
                 <option value="">-- Choose Member --</option>
                 {members.map(m => (
                   <option key={m.userId} value={m.userId}>{m.user?.name} ({m.user?.email})</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Select Package (Optional)</label>
               <select
                 value={checkinForm.packageId}
                 onChange={(e) => setCheckinForm({ ...checkinForm, packageId: e.target.value })}
                 className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 transition-all outline-none"
               >
                 <option value="">-- Auto-select Active Wallet --</option>
                 {packages.map(p => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Remarks</label>
               <input 
                 type="text" 
                 value={checkinForm.remarks}
                 onChange={(e) => setCheckinForm({ ...checkinForm, remarks: e.target.value })}
                 placeholder="Manual check-in by Admin..." 
                 className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
               />
             </div>
             <button 
               type="submit" 
               disabled={checkinSubmitting || !checkinForm.userId}
               className="w-full bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-md transition-all mt-4 disabled:opacity-50"
             >
               {checkinSubmitting ? 'Processing...' : 'Submit Check-in'}
             </button>
           </form>
        </div>
      )}

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Active Session Wallets</h2>
              <p className="text-slate-500 font-medium">View all active wallets of members.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Member</th>
                  <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Package</th>
                  <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Remaining</th>
                  <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wallets.length > 0 ? wallets.map((w: SessionWallet) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-900">{w.user?.name || '-'}</td>
                    <td className="px-6 py-5 font-bold text-slate-700">{w.package?.name || '-'}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        w.walletStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                        (w.walletStatus === 'WAITING' || w.walletStatus === 'WAITLIST') ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {w.walletStatus}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900">{w.remainingSession} / {w.totalSession}</td>
                    <td className="px-6 py-5 text-slate-500 font-medium">
                      {w.expiredDate ? new Date(w.expiredDate).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      No active wallets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal New Package */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full my-8 animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editPackageId ? 'Edit Session Package' : 'Create Session Package'}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Define activity, category, and pricing details.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                
                {/* Section 1: Classification */}
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> 1. Classification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Activity Field */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex justify-between items-center">
                        Activity
                        <button type="button" 
                          onClick={() => setFormData({ ...formData, activityMode: formData.activityMode === 'select' ? 'new' : 'select', categoryMode: 'new', categoryId: '' })}
                          className="text-indigo-600 hover:text-indigo-700 font-bold text-xs bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          {formData.activityMode === 'select' ? '+ New Activity' : 'Select Existing'}
                        </button>
                      </label>
                      {formData.activityMode === 'select' ? (
                        <select 
                          required
                          value={formData.activityId}
                          onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all shadow-sm hover:border-slate-300"
                        >
                          <option value="">Select Activity</option>
                          {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      ) : (
                        <input type="text" required placeholder="e.g. Basket, Renang"
                          value={formData.activityName}
                          onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 transition-all shadow-sm hover:border-slate-300"
                        />
                      )}
                    </div>

                    {/* Category Field */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex justify-between items-center">
                        Category / Level
                        {formData.activityMode === 'select' && (
                          <button type="button" 
                            onClick={() => setFormData({ ...formData, categoryMode: formData.categoryMode === 'select' ? 'new' : 'select' })}
                            className="text-indigo-600 hover:text-indigo-700 font-bold text-xs bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            {formData.categoryMode === 'select' ? '+ New Category' : 'Select Existing'}
                          </button>
                        )}
                      </label>
                      {formData.categoryMode === 'select' && formData.activityMode === 'select' ? (
                        <select 
                          required
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all shadow-sm hover:border-slate-300"
                          disabled={!formData.activityId}
                        >
                          <option value="">Select Category</option>
                          {selectedActivity?.categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <input type="text" required placeholder="e.g. Starter (5-8 yrs), Pro"
                          value={formData.categoryName}
                          onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 transition-all shadow-sm hover:border-slate-300"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Package Details */}
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> 2. Package Details
                  </h4>
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">Package Name</label>
                      <input type="text" required placeholder="e.g. Paket Hemat 6 Sesi"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 transition-all shadow-sm hover:border-slate-300"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                        Description <span className="text-xs text-slate-400 font-semibold">Optional</span>
                      </label>
                      <textarea rows={3} placeholder="Package benefits, terms, etc."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-slate-900 resize-none transition-all shadow-sm hover:border-slate-300"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                        Package Image (Header) <span className="text-xs text-slate-400 font-semibold">Optional</span>
                      </label>
                      <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-colors">
                        {(imageFile || formData.image) && (
                          <div className="relative mb-4 group">
                            <img 
                              src={imageFile ? URL.createObjectURL(imageFile) : formData.image} 
                              alt="Package Preview" 
                              className="w-full h-40 object-cover rounded-xl shadow-sm border border-slate-100"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-bold text-sm bg-slate-900/60 px-4 py-2 rounded-full">Change Image</span>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                            }
                          }}
                          className={`w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors cursor-pointer ${!imageFile && !formData.image ? 'py-4' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Total Sessions</label>
                        <div className="relative">
                          <input type="number" required min="1"
                            value={formData.totalSession}
                            onChange={(e) => setFormData({ ...formData, totalSession: Number(e.target.value) })}
                            className="w-full pl-5 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black text-indigo-600 transition-all shadow-sm hover:border-slate-300"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Sesi</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Masa Berlaku</label>
                        <div className="relative">
                          <input type="number" required min="1"
                            value={formData.validDays}
                            onChange={(e) => setFormData({ ...formData, validDays: Number(e.target.value) })}
                            className="w-full pl-5 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black text-indigo-600 transition-all shadow-sm hover:border-slate-300"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Hari</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Kuota Reguler (Opsional)</label>
                        <div className="relative">
                          <input type="number" min="1"
                            value={formData.quota}
                            onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                            placeholder="Unlimited"
                            className="w-full pl-5 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black text-indigo-600 transition-all shadow-sm hover:border-slate-300"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Orang</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Kuota Privat (Opsional)</label>
                        <div className="relative">
                          <input type="number" min="1"
                            value={formData.privateQuota}
                            onChange={(e) => setFormData({ ...formData, privateQuota: e.target.value })}
                            placeholder="Unlimited"
                            className="w-full pl-5 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 font-black text-amber-600 transition-all shadow-sm hover:border-slate-300"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Orang</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Pricing */}
                <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                  <h4 className="text-sm font-black text-indigo-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> 3. Pricing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">Normal Price</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                        <input type="number" required min="0"
                          value={formData.memberPrice}
                          onChange={(e) => setFormData({ ...formData, memberPrice: Number(e.target.value) })}
                          className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black text-slate-900 transition-all shadow-sm hover:border-slate-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                        Private Price <span className="text-xs text-slate-400 font-semibold">Optional</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                        <input type="number" min="0"
                          value={formData.vipPrice}
                          onChange={(e) => setFormData({ ...formData, vipPrice: Number(e.target.value) })}
                          className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black text-amber-600 transition-all shadow-sm hover:border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Rules */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-black text-indigo-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> 4. Purchase Requirements
                  </h4>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Syarat Pembelian Paket</label>
                    <select
                      value={formData.accessRule}
                      onChange={(e) => setFormData({ ...formData, accessRule: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 transition-all shadow-sm hover:border-slate-300 outline-none"
                    >
                      <option value="PUBLIC">Terbuka Untuk Umum (Public)</option>
                      <option value="MEMBER_ONLY">Hanya Anggota Komunitas (Registered Members)</option>
                    </select>
                    <p className="text-xs text-slate-400">Tentukan siapa saja yang diperbolehkan membeli paket sesi ini.</p>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="pt-8 flex justify-end items-center gap-4 border-t border-slate-100 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0">
                  {submitting ? 'Saving...' : (editPackageId ? 'Save Changes' : 'Create Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
