'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { getApiUrl } from '../../../lib/api';
import { getAuthHeaders } from '../../../lib/auth';
import { formatBlogDate, type BlogPostSummary } from '../../../lib/blog';
import ConfirmModal from '../../../components/ui/ConfirmModal';

type Filter = 'all' | 'published' | 'draft';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BlogPostSummary | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/blog-post/admin/all`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Gagal memuat artikel');
      setPosts(await res.json());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      all: posts.length,
      published: posts.filter((p) => p.isPublished).length,
      draft: posts.filter((p) => !p.isPublished).length,
    }),
    [posts],
  );

  const visible = posts.filter((post) => {
    if (filter === 'published' && !post.isPublished) return false;
    if (filter === 'draft' && post.isPublished) return false;
    const needle = search.trim().toLowerCase();
    return !needle || [post.title, post.cluster, post.slug].some((v) => v?.toLowerCase().includes(needle));
  });

  const togglePublish = async (post: BlogPostSummary) => {
    setBusyId(post.id);
    try {
      const res = await fetch(`${getApiUrl()}/blog-post/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPublished: !post.isPublished } : p)));
    } catch {
      setError('Gagal mengubah status artikel');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (post: BlogPostSummary) => {
    setToDelete(null);
    setBusyId(post.id);
    try {
      const res = await fetch(`${getApiUrl()}/blog-post/${post.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      setError('Gagal menghapus artikel');
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'published', label: 'Terbit' },
    { key: 'draft', label: 'Draf' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Artikel Blog</h1>
          <p className="text-slate-500 text-sm mt-1">Tulis, terbitkan, dan kelola artikel di latih.club/blog.</p>
        </div>
        <Link
          href="/super-admin/blog/new"
          className="inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Tulis artikel baru
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Total artikel', counts.all, 'text-slate-900'],
          ['Terbit', counts.published, 'text-emerald-600'],
          ['Draf', counts.draft, 'text-amber-600'],
        ].map(([label, value, color]) => (
          <div key={label as string} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</div>
            <div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div role="tablist" aria-label="Filter status" className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={filter === tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab.label} <span className="text-slate-400 font-semibold">{counts[tab.key]}</span>
              </button>
            ))}
          </div>
          <label className="relative flex-1 min-w-[220px] max-w-sm">
            <span className="sr-only">Cari artikel</span>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, kategori, atau slug"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </label>
        </div>

        {error && <div className="px-4 py-3 bg-red-50 text-red-700 text-sm font-medium">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Memuat artikel…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" aria-hidden="true" />
            </div>
            <b className="text-slate-900">{posts.length === 0 ? 'Belum ada artikel' : 'Tidak ada artikel yang cocok'}</b>
            {posts.length === 0 && (
              <Link href="/super-admin/blog/new" className="text-sm font-bold text-indigo-600 hover:underline">
                Tulis artikel pertama →
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-4 p-4 hover:bg-slate-50/60">
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {post.featuredImage && <img src={post.featuredImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-[220px]">
                  <Link href={`/super-admin/blog/${post.id}`} className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1">
                    {post.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${post.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                    >
                      {post.isPublished ? 'Terbit' : 'Draf'}
                    </span>
                    {post.cluster && <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">{post.cluster}</span>}
                    <span>Diperbarui {formatBlogDate(post.updatedAt)}</span>
                    <span>· {post.readingMinutes} mnt baca</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {post.isPublished && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Lihat ${post.title}`}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => togglePublish(post)}
                    className={`min-h-10 px-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${post.isPublished ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    {post.isPublished ? 'Jadikan draf' : 'Terbitkan'}
                  </button>
                  <Link
                    href={`/super-admin/blog/${post.id}`}
                    aria-label={`Edit ${post.title}`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => setToDelete(post)}
                    aria-label={`Hapus ${post.title}`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Tips: terbitkan 1–2 artikel per minggu seputar pertanyaan yang sering dicari pengelola klub (absensi, paket latihan, membership).
        Artikel yang terbit muncul di landing page dan daftar blog dalam ±1 menit.
      </p>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Hapus artikel?"
        message={toDelete ? `Artikel "${toDelete.title}" akan dihapus permanen.` : ''}
        confirmText="Hapus"
        isDestructive
        onConfirm={() => toDelete && remove(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
