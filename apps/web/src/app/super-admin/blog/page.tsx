'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Plus, Edit2, Trash2, Globe } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  cluster: string | null;
  isPublished: boolean;
  createdAt: string;
}

export default function BlogAdmin() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    cluster: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
  });

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiUrl()}/blog-post`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenNew = () => {
    setFormData({
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      cluster: 'Membership',
      featuredImage: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: true,
    });
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${getApiUrl()}/blog-post/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setFormData({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || '',
        content: data.content || '',
        cluster: data.cluster || '',
        featuredImage: data.featuredImage || '',
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        isPublished: data.isPublished,
      });
      setCurrentId(data.id);
      setIsEdit(true);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus artikel blog ini?')) return;
    const token = localStorage.getItem('token');
    await fetch(`${getApiUrl()}/blog-post/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchPosts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEdit ? `${getApiUrl()}/blog-post/${currentId}` : `${getApiUrl()}/blog-post`;
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchPosts();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch(`${getApiUrl()}/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, featuredImage: data.url });
      } else {
        alert('Gagal upload gambar');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex bg-slate-50">

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Blog CMS (Topical Authority)
              </h1>
              <p className="text-slate-500 text-sm mt-1">Tulis artikel berbasis cluster untuk meningkatkan authority SEO</p>
            </div>
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tulis Artikel
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Judul Artikel</th>
                    <th className="px-6 py-4 font-semibold">Slug</th>
                    <th className="px-6 py-4 font-semibold">Cluster / Kategori</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-500">Belum ada artikel yang ditulis.</td></tr>
                  ) : posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{post.title}</td>
                      <td className="px-6 py-4 font-mono text-indigo-600 text-xs">/blog/{post.slug}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
                          {post.cluster || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {post.isPublished ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Published</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenEdit(post.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul Artikel</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topical Cluster (Kategori)</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.cluster}
                    onChange={(e) => setFormData({...formData, cluster: e.target.value})}
                  >
                    <option value="Membership">Membership</option>
                    <option value="Absensi">Absensi</option>
                    <option value="Akademi">Akademi</option>
                    <option value="Retensi Member">Retensi Member</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image / Banner</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData({...formData, featuredImage: e.target.value})}
                      placeholder="/api/uploads/... atau https://..."
                    />
                    <label className={`flex-shrink-0 flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span className="text-sm font-medium text-slate-600">{isUploading ? 'Uploading...' : 'Upload'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konten Artikel (Mendukung HTML)</label>
                <textarea
                  required
                  rows={12}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="<h2>Sub Judul</h2><p>Tulis paragraf di sini...</p>"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="col-span-2"><h3 className="font-semibold text-slate-800">SEO Settings</h3></div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Meta Description / Excerpt</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={formData.metaDescription}
                    onChange={(e) => {
                      setFormData({
                        ...formData, 
                        metaDescription: e.target.value,
                        excerpt: e.target.value // Sync excerpt
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isPublished" className="text-sm text-slate-700 font-medium">Publish Artikel Ini</label>
              </div>

              <div className="pt-6 pb-2 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
                  Simpan Artikel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
