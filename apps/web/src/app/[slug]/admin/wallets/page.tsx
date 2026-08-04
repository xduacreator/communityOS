'use client';

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../../lib/auth';
import { Wallet, Search, Filter } from 'lucide-react';
import { SessionWallet } from '../../../../types';

export default function AdminWallets({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [wallets, setWallets] = useState<SessionWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityId, setCommunityId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [approvingId, setApprovingId] = useState<string | null>(null);

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

  const fetchData = async () => {
    if (!communityId) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/admin/community/${communityId}/wallets`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setWallets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this package purchase?')) return;
    
    setApprovingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/session-wallet/approve/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to approve wallet');
      }
      
      alert('Wallet approved successfully!');
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setApprovingId(null);
    }
  };

  const filteredWallets = wallets.filter(w => {
    const matchesSearch = 
      w.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.package?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || w.walletStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto pb-12 p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Pembelian</h1>
          <p className="mt-2 text-slate-500">Kelola riwayat pembelian paket sesi dan keanggotaan member</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto">
          <Wallet className="w-6 h-6 text-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm text-slate-700 w-full sm:w-auto shadow-sm outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="WAITLIST">Waitlist</option>
            <option value="ACTIVE">Active</option>
            <option value="WAITING">Waiting</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
            <option value="FROZEN">Frozen</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Member</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Package Details</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Sessions</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Status</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Expiry Date</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold">
                    Loading wallets...
                  </td>
                </tr>
              ) : filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold">
                    No purchased packages found.
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-slate-50 transition-colors bg-white">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">{wallet.user?.name || 'Unknown'}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">{wallet.user?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-xs inline-block">
                        {wallet.package?.name}
                      </span>
                      <div className="text-xs font-bold text-indigo-600 mt-2">
                        Rp {wallet.package ? (wallet.isPrivate ? wallet.package.vipPrice : wallet.package.memberPrice)?.toLocaleString('id-ID') : 0}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                        Bought: {wallet.purchaseDate ? new Date(wallet.purchaseDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-end gap-1.5">
                        <span className="font-black text-xl text-indigo-600">{wallet.remainingSession}</span>
                        <span className="text-xs text-slate-400 font-bold mb-1">/ {wallet.totalSession}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${(wallet.remainingSession / wallet.totalSession) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-[11px] leading-5 font-black uppercase tracking-wider rounded-lg ${
                        wallet.walletStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        wallet.walletStatus === 'FROZEN' ? 'bg-sky-100 text-sky-700' :
                        wallet.walletStatus === 'EXPIRED' ? 'bg-rose-100 text-rose-700' :
                        (wallet.walletStatus === 'WAITING' || wallet.walletStatus === 'WAITLIST' || wallet.walletStatus === 'PENDING') ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {wallet.walletStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">
                        {wallet.expiredDate ? new Date(wallet.expiredDate).toLocaleDateString() : 'No Expiry'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(wallet.walletStatus === 'PENDING' || wallet.walletStatus === 'WAITLIST') && (
                        <button
                          onClick={() => handleApprove(wallet.id)}
                          disabled={approvingId === wallet.id}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                        >
                          {approvingId === wallet.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
