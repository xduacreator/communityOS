'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Plus, Edit2, Trash2, Globe, Sparkles } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { getAuthHeaders } from '@/lib/auth';

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  h1: string;
  targetKeywords: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SeoPagesAdmin() {
  const router = useRouter();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    h1: '',
    targetKeywords: '',
    summaryParagraph: '',
    features: '',
    faqContent: '',
    isActive: true,
  });

  const fetchPages = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/landing-page`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (error) {
      console.error('Failed to fetch SEO pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleOpenNew = () => {
    setFormData({
      slug: '',
      title: '',
      h1: '',
      targetKeywords: '',
      summaryParagraph: 'Latih.club adalah sistem manajemen latihan yang membantu klub olahraga, akademi, studio dan komunitas mengelola membership, paket latihan, jadwal dan kehadiran peserta.',
      features: '',
      faqContent: '[\n  {\n    "question": "Apa itu software manajemen latihan?",\n    "answer": "Latih.club adalah software berbasis cloud..."\n  }\n]',
      isActive: true,
    });
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (id: string) => {
    const headers = getAuthHeaders();
    const res = await fetch(`${getApiUrl()}/landing-page/${id}`, {
      headers
    });
    if (res.ok) {
      const data = await res.json();
      setFormData({
        slug: data.slug,
        title: data.title,
        h1: data.h1,
        targetKeywords: data.targetKeywords || '',
        summaryParagraph: data.summaryParagraph || '',
        features: data.features || '',
        faqContent: data.faqContent || '',
        isActive: data.isActive,
      });
      setCurrentId(data.id);
      setIsEdit(true);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus halaman SEO ini?')) return;
    const headers = getAuthHeaders();
    await fetch(`${getApiUrl()}/landing-page/${id}`, {
      method: 'DELETE',
      headers
    });
    fetchPages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    const url = isEdit ? `${getApiUrl()}/landing-page/${currentId}` : `${getApiUrl()}/landing-page`;
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchPages();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="flex bg-slate-50">

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-6 h-6 text-indigo-600" />
                SEO Landing Pages
              </h1>
              <p className="text-slate-500 text-sm mt-1">Kelola halaman vertical / industry (contoh: /gym-management, /membership)</p>
            </div>
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Halaman SEO
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Slug (URL)</th>
                    <th className="px-6 py-4 font-semibold">H1 / Title</th>
                    <th className="px-6 py-4 font-semibold">Target Keyword</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pages.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-500">Belum ada halaman SEO yang dibuat.</td></tr>
                  ) : pages.map((page) => (
                    <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-indigo-600">/{page.slug}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{page.h1}</div>
                        <div className="text-xs text-slate-500">{page.title}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{page.targetKeywords || '-'}</td>
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
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Halaman SEO' : 'Buat Halaman SEO Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL Path)</label>
                  <input
                    type="text"
                    required
                    placeholder="gym-management"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Akan menjadi: latih.club/{formData.slug || '...'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Keywords</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="software gym, aplikasi gym management"
                    value={formData.targetKeywords}
                    onChange={(e) => setFormData({...formData, targetKeywords: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title (SEO Title)</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Headline Utama (H1)</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.h1}
                  onChange={(e) => setFormData({...formData, h1: e.target.value})}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Ringkasan AI (SGE/ChatGPT Geo Strategy)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.summaryParagraph}
                  onChange={(e) => setFormData({...formData, summaryParagraph: e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">Contoh: Latih.club adalah sistem manajemen latihan yang membantu klub olahraga...</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">FAQ Content (JSON Array)</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  value={formData.faqContent}
                  onChange={(e) => setFormData({...formData, faqContent: e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">Gunakan format JSON: [{`{"question":"...","answer":"..."}`}]</p>
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

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
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
