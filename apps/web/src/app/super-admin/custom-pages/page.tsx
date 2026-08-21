'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { getAuthHeaders } from '@/lib/auth';
import { Plus, Edit2, Trash2, LayoutDashboard, FileText, Loader2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export default function CustomPagesAdmin() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    slug: '',
    title: '',
    content: '',
    isActive: true,
  });

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl() + '/custom-page', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch custom pages');
      const data = await res.json();
      setPages(data);
    } catch (err) {
      console.error(err);
      alert('Error fetching custom pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      id: '',
      slug: '',
      title: '',
      content: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;
    setIsEdit(true);
    setFormData({
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content || '',
      isActive: page.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus halaman ini?')) return;
    try {
      const res = await fetch(getApiUrl() + `/custom-page/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete');
      alert('Halaman berhasil dihapus');
      fetchPages();
    } catch (err) {
      alert('Error deleting page');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEdit ? getApiUrl() + `/custom-page/${formData.id}` : getApiUrl() + '/custom-page';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload = {
        slug: formData.slug,
        title: formData.title,
        content: formData.content,
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save');
      }

      alert('Berhasil menyimpan halaman!');
      setIsModalOpen(false);
      fetchPages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving page');
    }
  };

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Custom Pages</h1>
          <p className="text-slate-500 mt-2">Kelola halaman dinamis kustom (Kebijakan Privasi, dll) di root domain.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Buat Halaman
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Slug (URL)</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">Belum ada halaman kustom.</td></tr>
                ) : pages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-indigo-600 hover:text-indigo-800">
                        <LinkIcon className="w-3.5 h-3.5" />
                        /{page.slug}
                      </a>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{page.title}</td>
                    <td className="px-6 py-4">
                      {page.isActive ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Aktif</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">Draft</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenEdit(page.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(page.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Halaman' : 'Buat Halaman Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL Path)</label>
                  <input
                    type="text"
                    required
                    placeholder="privacy-policy"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Akan menjadi: latih.club/{formData.slug || '...'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul Halaman (H1)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konten HTML</label>
                <textarea
                  rows={12}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="<h2>Heading</h2><p>Paragraf...</p>"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Halaman Aktif / Publish</label>
              </div>

              <div className="pt-6 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                  Batal
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                  Simpan Halaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
