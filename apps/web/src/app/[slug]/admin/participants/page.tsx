'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Search, Users } from 'lucide-react';
import { getApiUrl } from '../../../../lib/api';
import { getAuthHeaders } from '../../../../lib/auth';

interface SessionParticipant {
  id: string;
  userId: string;
  packageId: string;
  walletStatus: string;
  totalSession: number;
  remainingSession: number;
  expiredDate?: string | null;
  isPrivate: boolean;
  user: { name: string };
  package: { name: string };
}

export default function SessionParticipantsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [communityId, setCommunityId] = useState('');
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadParticipants = async (id: string) => {
    const response = await fetch(
      `${getApiUrl()}/session-wallet/operations/community/${id}/participants`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) throw new Error('Tidak dapat mengambil daftar peserta sesi.');
    setParticipants(await response.json());
  };

  useEffect(() => {
    const load = async () => {
      try {
        const communityResponse = await fetch(`${getApiUrl()}/communities/${resolvedParams.slug}`);
        if (!communityResponse.ok) throw new Error('Komunitas tidak ditemukan.');
        const community = await communityResponse.json();
        setCommunityId(community.id);
        await loadParticipants(community.id);
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [resolvedParams.slug]);

  const filteredParticipants = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return participants;
    return participants.filter((participant) =>
      participant.user.name.toLowerCase().includes(keyword) ||
      participant.package.name.toLowerCase().includes(keyword),
    );
  }, [participants, searchTerm]);

  const handleCheckIn = async (participant: SessionParticipant) => {
    if (!communityId || !window.confirm(`Check-in ${participant.user.name} menggunakan ${participant.package.name}?`)) return;

    setCheckingInId(participant.id);
    setMessage(null);
    try {
      const response = await fetch(`${getApiUrl()}/session-wallet/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          userId: participant.userId,
          communityId,
          packageId: participant.packageId,
          remarks: 'Check-in oleh Coach/Admin',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Check-in gagal.');

      setMessage({ type: 'success', text: `Check-in ${participant.user.name} berhasil.` });
      await loadParticipants(communityId);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Check-in gagal.' });
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 p-4 sm:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Peserta Sesi</h1>
          <p className="mt-2 text-slate-500">Lihat saldo sesi aktif dan lakukan check-in peserta.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <Users className="w-5 h-5 text-indigo-600" />
          <span className="font-extrabold text-slate-800">{participants.length} peserta aktif</span>
        </div>
      </div>

      {message && (
        <div className={`mb-5 px-5 py-4 rounded-2xl border font-bold text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama peserta atau paket..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Peserta</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Paket</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Sisa Sesi</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Berlaku Sampai</th>
                <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-14 text-center text-slate-500 font-bold">Memuat peserta...</td></tr>
              ) : filteredParticipants.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-14 text-center text-slate-500 font-bold">Tidak ada peserta aktif.</td></tr>
              ) : filteredParticipants.map((participant) => (
                <tr key={participant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 font-extrabold text-slate-900">{participant.user.name}</td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-700">{participant.package.name}</div>
                    {participant.isPrivate && <span className="text-xs font-bold text-amber-600">Private</span>}
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black text-lg text-indigo-600">{participant.remainingSession}</span>
                    <span className="text-slate-400 font-semibold"> / {participant.totalSession}</span>
                  </td>
                  <td className="px-6 py-5 text-slate-600 font-semibold">
                    {participant.expiredDate ? new Date(participant.expiredDate).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleCheckIn(participant)}
                      disabled={checkingInId === participant.id}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {checkingInId === participant.id ? 'Memproses...' : 'Check-in'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
