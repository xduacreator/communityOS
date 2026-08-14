'use client';
import { getApiUrl } from '../../../../lib/api';

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../../lib/auth';
import { 
  Ticket, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Percent, 
  DollarSign, 
  Copy, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import ConfirmModal from '../../../../components/ui/ConfirmModal';

interface PromoVoucher {
  id: string;
  communityId: string;
  code: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export default function AdminVouchersPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [vouchers, setVouchers] = useState<PromoVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityId, setCommunityId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<PromoVoucher | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [minPurchase, setMinPurchase] = useState<number | ''>('');
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const fetchVouchers = async () => {
    try {
      const headers = getAuthHeaders();
      // First get community details to get communityId
      const comRes = await fetch(`${getApiUrl()}/communities/slug/${resolvedParams.slug}`);
      if (!comRes.ok) throw new Error('Komunitas tidak ditemukan');
      const comData = await comRes.json();
      setCommunityId(comData.id);

      const res = await fetch(`${getApiUrl()}/promo-vouchers/community/${comData.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setVouchers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [resolvedParams.slug]);

  const resetForm = () => {
    setEditingVoucher(null);
    setCode('');
    setDescription('');
    setDiscountType('FIXED');
    setDiscountValue('');
    setMinPurchase('');
    setMaxDiscount('');
    setMaxUses('');
    setValidUntil('');
    setStatus('ACTIVE');
    setErrorMsg('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (voucher: PromoVoucher) => {
    setEditingVoucher(voucher);
    setCode(voucher.code);
    setDescription(voucher.description || '');
    setDiscountType(voucher.discountType);
    setDiscountValue(voucher.discountValue);
    setMinPurchase(voucher.minPurchase ?? '');
    setMaxDiscount(voucher.maxDiscount ?? '');
    setMaxUses(voucher.maxUses ?? '');
    setValidUntil(voucher.validUntil ? new Date(voucher.validUntil).toISOString().split('T')[0] : '');
    setStatus(voucher.status);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('Kode voucher wajib diisi');
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      setErrorMsg('Nilai diskon harus lebih besar dari 0');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const headers = getAuthHeaders();
      const payload = {
        communityId,
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discountType,
        discountValue: Number(discountValue),
        minPurchase: minPurchase !== '' ? Number(minPurchase) : undefined,
        maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : undefined,
        maxUses: maxUses !== '' ? Number(maxUses) : undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        status,
      };

      const url = editingVoucher
        ? `${getApiUrl()}/promo-vouchers/${editingVoucher.id}`
        : `${getApiUrl()}/promo-vouchers`;

      const res = await fetch(url, {
        method: editingVoucher ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan voucher');
      }

      setIsModalOpen(false);
      resetForm();
      fetchVouchers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (voucher: PromoVoucher) => {
    try {
      const headers = getAuthHeaders();
      const newStatus = voucher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`${getApiUrl()}/promo-vouchers/${voucher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchVouchers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = (id: string) => {
    setVoucherToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!voucherToDelete) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/promo-vouchers/${voucherToDelete}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        fetchVouchers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setVoucherToDelete(null);
    }
  };

  const copyCode = (voucherCode: string) => {
    navigator.clipboard.writeText(voucherCode);
    setCopiedCode(voucherCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredVouchers = vouchers.filter((v) =>
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = vouchers.filter((v) => v.status === 'ACTIVE').length;
  const totalUses = vouchers.reduce((acc, v) => acc + (v.usedCount || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            Kode Promo & Voucher Diskon
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Buat kode diskon spesial (misal <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-indigo-600">LATIHNEWBER</code>) untuk menarik member baru & perpanjangan.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Voucher Baru</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Voucher</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{vouchers.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Voucher Aktif</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{activeCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Penggunaan</p>
            <h3 className="text-3xl font-black text-purple-600 mt-1">{totalUses}x</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode promo atau deskripsi..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Voucher Cards / Table */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Belum Ada Voucher</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Buat kode diskon promo pertama Anda untuk menarik lebih banyak member baru dan meningkatkan perpanjangan.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Voucher Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Kode Promo</th>
                  <th className="py-4 px-6">Tipe & Nilai Diskon</th>
                  <th className="py-4 px-6">Syarat Belanja</th>
                  <th className="py-4 px-6">Penggunaan</th>
                  <th className="py-4 px-6">Berlaku s/d</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredVouchers.map((voucher) => {
                  const isExpired = Boolean(voucher.validUntil && new Date(voucher.validUntil) < new Date());
                  const isLimitReached = typeof voucher.maxUses === 'number' && voucher.usedCount >= voucher.maxUses;

                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Code */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900 text-sm tracking-wider">
                            {voucher.code}
                          </span>
                          <button
                            onClick={() => copyCode(voucher.code)}
                            title="Salin Kode"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            {copiedCode === voucher.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        {voucher.description && (
                          <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">{voucher.description}</p>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                        {voucher.discountType === 'FIXED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            Potongan Rp {voucher.discountValue.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                              Diskon {voucher.discountValue}%
                            </span>
                            {voucher.maxDiscount && (
                              <p className="text-[11px] text-slate-400 font-normal">Maks. Rp {voucher.maxDiscount.toLocaleString('id-ID')}</p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Min Purchase */}
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {voucher.minPurchase ? (
                          <span>Min. Rp {voucher.minPurchase.toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-slate-400">Tanpa Minimal</span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {voucher.usedCount} {voucher.maxUses ? `/ ${voucher.maxUses}` : 'kali'}
                          </span>
                          {voucher.maxUses && (
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, (voucher.usedCount / voucher.maxUses) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expiration */}
                      <td className="py-4 px-6 text-xs font-medium">
                        {voucher.validUntil ? (
                          <span className={isExpired ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                            {new Date(voucher.validUntil).toLocaleDateString('id-ID')}
                            {isExpired && ' (Expired)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Tanpa Batas</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(voucher)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${
                            voucher.status === 'ACTIVE' && !isExpired && !isLimitReached
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            voucher.status === 'ACTIVE' && !isExpired && !isLimitReached ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {voucher.status === 'ACTIVE' && !isExpired && !isLimitReached ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(voucher)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          title="Edit Voucher"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(voucher.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                          title="Hapus Voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Create/Edit Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 dark:border-slate-800 my-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                {editingVoucher ? 'Edit Kode Promo' : 'Buat Voucher Diskon Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kode Voucher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Kode Promo (Contoh: LATIHNEWBER) *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LATIHNEWBER"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Diskon spesial member baru"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                />
              </div>

              {/* Tipe Diskon */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDiscountType('FIXED')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    discountType === 'FIXED'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Potongan Nominal (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('PERCENTAGE')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    discountType === 'PERCENTAGE'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  Persentase (%)
                </button>
              </div>

              {/* Nilai Diskon */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {discountType === 'FIXED' ? 'Nilai Potongan (Rp) *' : 'Persentase Diskon (%) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={discountType === 'FIXED' ? '50000' : '10'}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
                />
              </div>

              {/* Max Discount (If percentage) */}
              {discountType === 'PERCENTAGE' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Maksimal Potongan (Rp) (Opsional)
                  </label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="100000"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                  />
                </div>
              )}

              {/* Minimum Purchase */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Minimal Pembelian (Rp) (Opsional)
                </label>
                <input
                  type="number"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="100000"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                />
              </div>

              {/* Max Uses & Valid Until */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Maksimal Penggunaan (Kuota)
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 100"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Berlaku Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingVoucher ? 'Simpan Perubahan' : 'Buat Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus Voucher Promo"
        message="Apakah Anda yakin ingin menghapus voucher ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setVoucherToDelete(null);
        }}
      />
    </div>
  );
}
