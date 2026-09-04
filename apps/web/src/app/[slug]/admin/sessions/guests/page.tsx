'use client';
import { getApiUrl } from '../../../../../lib/api';

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../../../lib/auth';
import { Users, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GuestRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  package: {
    name: string;
  };
}

export default function AdminGuestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [guests, setGuests] = useState<GuestRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    const headers = getAuthHeaders();

    try {
      const commRes = await fetch(`${getApiUrl()}/communities/${resolvedParams.slug}`);
      if (!commRes.ok) throw new Error('Community not found');
      const commData = await commRes.json();

      const guestRes = await fetch(`${getApiUrl()}/guest-registrations/community/${commData.id}`, {
        headers: { ...headers },
      });
      if (!guestRes.ok) throw new Error('Failed to fetch guest registrations');
      const guestData = await guestRes.json();
      
      setGuests(guestData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.slug]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/guest-registrations/${id}/status`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link href={`/${resolvedParams.slug}/admin/sessions`} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pendaftar Umum</h1>
            <p className="text-sm font-semibold text-slate-500">Kelola kehadiran peserta non-member untuk acara umum</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-5 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Peserta</th>
                <th className="py-5 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Kontak</th>
                <th className="py-5 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Paket / Acara</th>
                <th className="py-5 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-5 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                    Belum ada pendaftar umum.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{guest.name}</div>
                      <div className="text-xs text-slate-400">{guest.address}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-semibold text-slate-700">{guest.email}</div>
                      <div className="text-xs text-slate-400">{guest.phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-slate-700">{guest.package?.name}</div>
                      <div className="text-xs text-slate-400">{new Date(guest.createdAt).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 text-[11px] font-black rounded-lg uppercase tracking-wider ${
                        guest.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        guest.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                        (guest.status === 'PENDING' || guest.status === 'WAITING' || guest.status === 'WAITLIST') ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {guest.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        {(guest.status === 'PENDING' || guest.status === 'WAITLIST') && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(guest.id, 'APPROVED')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                              title="Setujui (Hadir)"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(guest.id, 'REJECTED')}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Tolak"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
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
