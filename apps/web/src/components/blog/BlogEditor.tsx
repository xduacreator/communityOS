'use client';
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import {
  ArrowLeft,
  Bold,
  Check,
  ExternalLink,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Search,
  Send,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api';
import { getAuthHeaders } from '../../lib/auth';
import { ARTICLE_PROSE, BLOG_CATEGORIES, type BlogPost } from '../../lib/blog';

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cluster: string;
  featuredImage: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
}

const EMPTY: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cluster: 'Operasional Klub',
  featuredImage: '',
  metaTitle: '',
  metaDescription: '',
  isPublished: false,
};

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function uploadImage(file: File): Promise<string> {
  const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true });
  const body = new FormData();
  body.append('file', compressed);
  const res = await fetch(`${getApiUrl()}/upload`, { method: 'POST', headers: getAuthHeaders(), body });
  if (!res.ok) throw new Error('Gagal mengunggah gambar');
  return (await res.json()).url as string;
}

function Counter({ value, ideal, max }: { value: string; ideal: number; max?: number }) {
  const over = value.length > ideal;
  return (
    <span className={`text-xs font-semibold ${over ? 'text-amber-600' : 'text-slate-400'}`}>
      {value.length}/{max ?? ideal}
    </span>
  );
}

const fieldClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800';

export default function BlogEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!!postId);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'cover' | 'inline' | null>(null);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  // Load an existing article
  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/blog-post/admin/${postId}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Artikel tidak ditemukan');
        const post: BlogPost = await res.json();
        setForm({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          content: post.content,
          cluster: post.cluster || '',
          featuredImage: post.featuredImage || '',
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
          isPublished: post.isPublished,
        });
        setSavedSlug(post.isPublished ? post.slug : null);
        if (editorRef.current) editorRef.current.innerHTML = post.content;
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal memuat artikel' });
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  // Keep the editable area in sync after loading or switching back from preview
  useEffect(() => {
    if (mode === 'write' && editorRef.current && editorRef.current.innerHTML !== form.content) {
      editorRef.current.innerHTML = form.content;
    }
    // Only when the editor (re)appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, loading]);

  // Confirmation carried over from the first save of a new article
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = params.get('tersimpan');
    if (!saved) return;
    setMessage({ type: 'success', text: saved === 'terbit' ? 'Artikel tersimpan & tayang di blog.' : 'Draf tersimpan.' });
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const syncContent = () => update('content', editorRef.current?.innerHTML || '');

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncContent();
  };

  const insertLink = () => {
    const url = window.prompt('Alamat link (https://…)', 'https://');
    if (!url || url === 'https://') return;
    exec('createLink', url);
  };

  const insertImage = async (file: File) => {
    setUploading('inline');
    try {
      const url = await uploadImage(file);
      exec('insertHTML', `<img src="${url}" alt="" loading="lazy">`);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengunggah gambar' });
    } finally {
      setUploading(null);
    }
  };

  const setCover = async (file: File) => {
    setUploading('cover');
    try {
      update('featuredImage', await uploadImage(file));
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengunggah gambar' });
    } finally {
      setUploading(null);
    }
  };

  const save = useCallback(
    async (publish?: boolean) => {
      const isPublished = publish ?? form.isPublished;
      if (!form.title.trim()) {
        setMessage({ type: 'error', text: 'Judul wajib diisi.' });
        return;
      }
      if (!plainText(form.content) && !form.content.includes('<img')) {
        setMessage({ type: 'error', text: 'Isi artikel masih kosong.' });
        return;
      }
      setSaving(true);
      setMessage(null);
      try {
        const body = {
          ...form,
          isPublished,
          slug: form.slug.trim() || slugify(form.title),
          title: form.title.trim(),
          excerpt: form.excerpt.trim(),
          metaTitle: form.metaTitle.trim(),
          metaDescription: form.metaDescription.trim(),
        };
        const res = await fetch(postId ? `${getApiUrl()}/blog-post/${postId}` : `${getApiUrl()}/blog-post`, {
          method: postId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Gagal menyimpan artikel');
        }
        setForm((prev) => ({ ...prev, isPublished, slug: data.slug, content: data.content }));
        setSavedSlug(isPublished ? data.slug : null);
        setDirty(false);
        setMessage({ type: 'success', text: isPublished ? 'Artikel tersimpan & tayang di blog.' : 'Draf tersimpan.' });
        // A new article moves to its own URL; the next mount shows the saved message
        if (!postId) router.replace(`/super-admin/blog/${data.id}?tersimpan=${isPublished ? 'terbit' : 'draf'}`);
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menyimpan artikel' });
      } finally {
        setSaving(false);
      }
    },
    [form, postId, router],
  );

  // Ctrl/Cmd + S saves
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  const words = plainText(form.content).split(' ').filter(Boolean).length;
  const serpTitle = form.metaTitle.trim() || form.title.trim() || 'Judul artikel';
  const serpDesc = form.metaDescription.trim() || form.excerpt.trim() || plainText(form.content) || 'Deskripsi artikel akan tampil di sini.';
  const slugPreview = form.slug || slugify(form.title) || 'judul-artikel';

  const tools: { label: string; icon: typeof Bold; run: () => void }[] = [
    { label: 'Paragraf', icon: Pilcrow, run: () => exec('formatBlock', 'p') },
    { label: 'Subjudul', icon: Heading2, run: () => exec('formatBlock', 'h2') },
    { label: 'Sub-subjudul', icon: Heading3, run: () => exec('formatBlock', 'h3') },
    { label: 'Tebal', icon: Bold, run: () => exec('bold') },
    { label: 'Miring', icon: Italic, run: () => exec('italic') },
    { label: 'Daftar berpoin', icon: List, run: () => exec('insertUnorderedList') },
    { label: 'Daftar bernomor', icon: ListOrdered, run: () => exec('insertOrderedList') },
    { label: 'Kutipan', icon: Quote, run: () => exec('formatBlock', 'blockquote') },
    { label: 'Link', icon: Link2, run: insertLink },
    { label: 'Hapus format', icon: RemoveFormatting, run: () => exec('removeFormat') },
    { label: 'Urungkan', icon: Undo2, run: () => exec('undo') },
    { label: 'Ulangi', icon: Redo2, run: () => exec('redo') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Memuat artikel…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/blog" aria-label="Kembali ke daftar artikel" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{postId ? 'Ubah artikel' : 'Tulis artikel baru'}</h1>
            <p className="text-xs text-slate-500">
              {dirty ? 'Ada perubahan yang belum disimpan' : 'Semua perubahan tersimpan'} · Ctrl/⌘ + S untuk menyimpan
            </p>
          </div>
        </div>
        {savedSlug && (
          <a href={`/blog/${savedSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:underline">
            Lihat di blog <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>

      {message && (
        <div role="status" className={`px-4 py-3 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-5 items-start">
        {/* MAIN COLUMN */}
        <div className="flex-[2_1_560px] min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="blog-title" className="text-sm font-bold text-slate-700">Judul</label>
                <Counter value={form.title} ideal={70} />
              </div>
              <input
                id="blog-title"
                type="text"
                maxLength={160}
                value={form.title}
                onChange={(e) => {
                  update('title', e.target.value);
                  if (!slugTouched) update('slug', slugify(e.target.value));
                }}
                placeholder="Mis. Cara mengelola absensi klub lari tanpa ribet"
                className={`${fieldClass} text-xl font-bold`}
              />
              <p className="text-xs text-slate-500 mt-1.5">Ideal 50–70 karakter dan memuat kata kunci utama.</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="blog-excerpt" className="text-sm font-bold text-slate-700">
                  Ringkasan <span className="font-normal text-slate-400">— tampil di kartu & di bawah judul</span>
                </label>
                <Counter value={form.excerpt} ideal={200} max={300} />
              </div>
              <textarea
                id="blog-excerpt"
                rows={2}
                maxLength={300}
                value={form.excerpt}
                onChange={(e) => update('excerpt', e.target.value)}
                placeholder="1–2 kalimat yang menjawab inti artikel"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/70">
              <div role="tablist" aria-label="Mode editor" className="flex gap-1 bg-slate-200/60 rounded-lg p-0.5">
                {(['write', 'preview'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    {m === 'write' ? 'Tulis' : 'Pratinjau'}
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {words} kata · ±{Math.max(1, Math.round(words / 200))} mnt baca
              </span>
            </div>

            {mode === 'write' ? (
              <>
                <div role="toolbar" aria-label="Format teks" className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 sticky top-0 bg-white z-10">
                  {tools.map(({ label, icon: Icon, run }) => (
                    <button
                      key={label}
                      type="button"
                      title={label}
                      aria-label={label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={run}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </button>
                  ))}
                  <label title="Sisipkan gambar" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
                    <span className="sr-only">Sisipkan gambar</span>
                    {uploading === 'inline' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-4 h-4" aria-hidden="true" />}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) insertImage(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Isi artikel"
                  data-placeholder="Mulai menulis… Buka dengan 1–2 kalimat yang langsung menjawab pertanyaan pembaca."
                  onInput={syncContent}
                  onBlur={syncContent}
                  className={`${ARTICLE_PROSE} min-h-[460px] px-6 py-5 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400`}
                />
              </>
            ) : (
              <div className="px-6 py-6">
                {form.content ? (
                  <div className={ARTICLE_PROSE} dangerouslySetInnerHTML={{ __html: form.content }} />
                ) : (
                  <p className="text-slate-400">Belum ada isi untuk dipratinjau.</p>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Tips SEO: buka dengan jawaban langsung, pakai subjudul berupa pertanyaan yang dicari orang, dan sertakan contoh atau angka nyata.
          </p>
        </div>

        {/* SIDEBAR */}
        <aside className="flex-[1_1_300px] min-w-0 space-y-5 lg:sticky lg:top-4">
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="flex items-center gap-2 font-extrabold text-slate-900"><Send className="w-4 h-4" aria-hidden="true" /> Terbitkan</h2>
            <div role="radiogroup" aria-label="Status artikel" className="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1">
              {[
                [false, 'Draf'],
                [true, 'Terbit'],
              ].map(([value, label]) => (
                <button
                  key={label as string}
                  type="button"
                  role="radio"
                  aria-checked={form.isPublished === value}
                  onClick={() => update('isPublished', value as boolean)}
                  className={`py-2 rounded-lg text-sm font-bold ${form.isPublished === value ? (value ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500'}`}
                >
                  {label as string}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="blog-cluster" className="block text-sm font-bold text-slate-700 mb-1.5">Kategori</label>
              <input
                id="blog-cluster"
                list="blog-categories"
                maxLength={60}
                value={form.cluster}
                onChange={(e) => update('cluster', e.target.value)}
                className={fieldClass}
                placeholder="Pilih atau ketik kategori"
              />
              <datalist id="blog-categories">
                {BLOG_CATEGORIES.map((category) => <option key={category} value={category} />)}
              </datalist>
            </div>
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="w-full min-h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
              {form.isPublished ? 'Simpan & tayangkan' : 'Simpan draf'}
            </button>
            {!form.isPublished && (
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving}
                className="w-full min-h-11 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 disabled:opacity-60"
              >
                Simpan & terbitkan sekarang
              </button>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div>
              <h2 className="font-extrabold text-slate-900">Gambar sampul</h2>
              <p className="text-xs text-slate-500 mt-0.5">JPG/PNG/WebP, disarankan 1200×630 px.</p>
            </div>
            {form.featuredImage ? (
              <div className="space-y-2">
                <img src={form.featuredImage} alt="Pratinjau gambar sampul" className="w-full aspect-[1200/630] object-cover rounded-xl border border-slate-200" />
                <button
                  type="button"
                  onClick={() => update('featuredImage', '')}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:underline"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" /> Hapus gambar
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 aspect-[1200/630] rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold cursor-pointer hover:border-indigo-300 hover:text-indigo-600">
                {uploading === 'cover' ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> : <Upload className="w-6 h-6" aria-hidden="true" />}
                {uploading === 'cover' ? 'Mengunggah…' : 'Klik untuk unggah sampul'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCover(file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="flex items-center gap-2 font-extrabold text-slate-900"><Search className="w-4 h-4" aria-hidden="true" /> SEO</h2>
              <p className="text-xs text-slate-500 mt-0.5">Kosongkan untuk memakai judul & ringkasan.</p>
            </div>
            <div>
              <label htmlFor="blog-slug" className="block text-sm font-bold text-slate-700 mb-1.5">Slug URL</label>
              <div className="flex items-center rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
                <span className="pl-3 text-sm text-slate-400 select-none">/blog/</span>
                <input
                  id="blog-slug"
                  type="text"
                  maxLength={100}
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update('slug', slugify(e.target.value));
                  }}
                  placeholder="otomatis-dari-judul"
                  className="flex-1 min-w-0 px-1 py-3 outline-none text-slate-800"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="blog-meta-title" className="text-sm font-bold text-slate-700">Judul SEO</label>
                <Counter value={form.metaTitle} ideal={60} />
              </div>
              <input id="blog-meta-title" type="text" maxLength={80} value={form.metaTitle} onChange={(e) => update('metaTitle', e.target.value)} className={fieldClass} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="blog-meta-desc" className="text-sm font-bold text-slate-700">Deskripsi SEO</label>
                <Counter value={form.metaDescription} ideal={160} />
              </div>
              <textarea id="blog-meta-desc" rows={3} maxLength={180} value={form.metaDescription} onChange={(e) => update('metaDescription', e.target.value)} className={fieldClass} />
            </div>
            <div aria-label="Pratinjau hasil Google" className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1">
              <span className="block text-xs text-slate-500 truncate">latih.club › blog › {slugPreview}</span>
              <b className="block text-[#1a0dab] text-base leading-snug">{serpTitle.length > 62 ? `${serpTitle.slice(0, 60)}…` : serpTitle}</b>
              <p className="text-sm text-slate-600 leading-snug">{serpDesc.length > 160 ? `${serpDesc.slice(0, 157)}…` : serpDesc}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
