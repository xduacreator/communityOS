'use client';
import { getApiUrl } from '../../../lib/api';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../lib/auth';
import { Save, Loader2, Globe, LayoutTemplate, AlertOctagon, Megaphone, Zap, Upload, Trash2, Image as ImageIcon, Scale } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import imageCompression from 'browser-image-compression';

export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(getApiUrl() + '/system-settings/admin/all', {
          headers,
        });
        
        if (res.status === 401 || res.status === 403) {
           router.push('/');
           return;
        }

        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (key: string, file: File) => {
    try {
      setSaving(true);
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const res = await fetch(getApiUrl() + '/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to upload file (Status ${res.status}): ${errorText}`);
      }
      const data = await res.json();
      handleChange(key, data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload = Object.entries(settings)
        .filter(([key, value]) => key && value !== null && value !== undefined)
        .map(([key, value]) => ({ key, value: String(value) }));

      const res = await fetch(getApiUrl() + '/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ settings: payload }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetTransactions = async () => {
    setResetting(true);
    try {
      const res = await fetch(getApiUrl() + '/system-settings/reset-transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error('Failed to reset transactions');
      const data = await res.json();
      alert(`Success: ${data.message}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setResetting(false);
      setIsResetConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-2">Manage dynamic content for the main landing page.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-medium sticky top-28 z-50 shadow-xl shadow-emerald-500/20">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 pb-20">
        
        {/* Platform Branding & Logo CMS */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Platform Branding & Logo CMS</h2>
                <p className="text-xs text-slate-500">Kelola nama platform dan logo tampilan landing page (desktop & mobile).</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Platform Name</label>
              <input
                type="text"
                value={settings['platform.name'] || ''}
                onChange={(e) => handleChange('platform.name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Latih.Club"
              />
              <p className="text-xs text-slate-500 mt-2">Nama alternatif/brand platform saat logo tidak digunakan secara khusus.</p>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700">Platform Logo (CMS Landing Page)</label>
                {settings['platform.logo'] && (
                  <button
                    type="button"
                    onClick={() => handleChange('platform.logo', '')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset ke Logo Default (Latih.Club)
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Logo ini akan ditampilkan pada bagian **Header Navbar** dan **Footer** di landing page (baik desktop maupun mobile).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload / URL Input */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      Option 1: Upload File Gambar Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload('platform.logo', e.target.files[0]);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">Format disarankan: PNG, SVG, atau WebP (Latar transparan).</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      Option 2: Input URL Logo
                    </label>
                    <input
                      type="text"
                      value={settings['platform.logo'] || ''}
                      onChange={(e) => handleChange('platform.logo', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="https://example.com/logo.svg"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-5 bg-slate-900 rounded-2xl text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Live Preview Logo</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        settings['platform.logo'] ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {settings['platform.logo'] ? '✓ Custom Logo' : 'Default Latih.Club'}
                      </span>
                    </div>

                    {/* Preview on Light Navbar Background */}
                    <div className="mb-3">
                      <span className="text-[10px] font-medium text-slate-400 mb-1 block">Tampilan di Navbar Header (Light Background):</span>
                      <div className="p-3 bg-white/90 backdrop-blur rounded-xl border border-slate-700/50 flex items-center h-14">
                        <img 
                          src={settings['platform.logo'] || '/images/logo.svg'} 
                          alt="Logo Header Preview" 
                          className="h-9 w-auto object-contain"
                        />
                      </div>
                    </div>

                    {/* Preview on Dark Background */}
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 mb-1 block">Tampilan di Container / Dark Theme:</span>
                      <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center h-14">
                        <img 
                          src={settings['platform.logo'] || '/images/logo.svg'} 
                          alt="Logo Dark Preview" 
                          className="h-9 w-auto object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 truncate">
                    {settings['platform.logo'] ? (
                      <span className="text-emerald-400 font-mono">Active URL: {settings['platform.logo']}</span>
                    ) : (
                      <span>Memakai logo bawaan produk: <code className="text-indigo-300 font-mono">/images/logo.svg</code></span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700">Platform Favicon (Ikon Tab Browser)</label>
                {settings['platform.favicon'] && (
                  <button
                    type="button"
                    onClick={() => handleChange('platform.favicon', '')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Favicon
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Ikon berukuran kecil yang muncul pada tab browser di semua halaman website. (Disarankan rasio 1:1, format .png atau .ico).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Favicon Upload / URL Input */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      Option 1: Upload File Favicon
                    </label>
                    <input
                      type="file"
                      accept="image/x-icon,image/png,image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload('platform.favicon', e.target.files[0]);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      Option 2: Input URL Favicon
                    </label>
                    <input
                      type="text"
                      value={settings['platform.favicon'] || ''}
                      onChange={(e) => handleChange('platform.favicon', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="https://example.com/favicon.png"
                    />
                  </div>
                </div>

                {/* Live Preview Favicon */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 flex flex-col justify-center items-center relative overflow-hidden">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 text-center">Live Preview Tab Browser</div>
                  
                  {/* Fake Browser Tab UI */}
                  <div className="w-full max-w-xs bg-slate-100 rounded-t-lg flex border-b border-slate-200 px-2 pt-2">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-t-lg border border-slate-200 border-b-0 w-48 shadow-sm">
                      <img 
                        src={settings['platform.favicon'] || '/favicon.ico'} 
                        alt="Favicon Preview" 
                        className="w-4 h-4 object-contain"
                      />
                      <span className="text-xs text-slate-700 truncate font-medium">Latih.Club</span>
                    </div>
                  </div>
                  <div className="w-full max-w-xs h-8 bg-white border border-slate-200 border-t-0 rounded-b-lg shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Landing Page Hero */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Hero Section</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Headline</label>
              <textarea
                rows={3}
                value={settings['landing.hero.headline'] || ''}
                onChange={(e) => handleChange('landing.hero.headline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Ubah Audiens Anda Menjadi Bisnis Kelas & Aktivitas yang Laris Manis"
              />
              <p className="text-xs text-slate-500 mt-2">Gunakan &lt;span className=&quot;text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500&quot;&gt; untuk teks gradien.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sub-headline</label>
              <textarea
                rows={4}
                value={settings['landing.hero.subheadline'] || ''}
                onChange={(e) => handleChange('landing.hero.subheadline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Platform all-in-one untuk membangun, mengelola, dan melejitkan bisnis..."
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Hero Micro Features (Below Buttons)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Micro Feature 1 (Title)</label>
                  <input
                    type="text"
                    value={settings['landing.hero.micro1.title'] || ''}
                    onChange={(e) => handleChange('landing.hero.micro1.title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2"
                  />
                  <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={settings['landing.hero.micro1.desc'] || ''}
                    onChange={(e) => handleChange('landing.hero.micro1.desc', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Micro Feature 2 (Title)</label>
                  <input
                    type="text"
                    value={settings['landing.hero.micro2.title'] || ''}
                    onChange={(e) => handleChange('landing.hero.micro2.title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2"
                  />
                  <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={settings['landing.hero.micro2.desc'] || ''}
                    onChange={(e) => handleChange('landing.hero.micro2.desc', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Micro Feature 3 (Title)</label>
                  <input
                    type="text"
                    value={settings['landing.hero.micro3.title'] || ''}
                    onChange={(e) => handleChange('landing.hero.micro3.title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2"
                  />
                  <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={settings['landing.hero.micro3.desc'] || ''}
                    onChange={(e) => handleChange('landing.hero.micro3.desc', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Landing Page Features */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Features Section</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Section Headline</label>
              <input
                type="text"
                value={settings['landing.features.headline'] || ''}
                onChange={(e) => handleChange('landing.features.headline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Semua yang Anda butuhkan untuk mengelola kelas, dalam satu platform."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="col-span-full font-bold text-slate-800">Feature 1: Microsite</div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={settings['landing.features.1.title'] || ''}
                  onChange={(e) => handleChange('landing.features.1.title', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={settings['landing.features.1.desc'] || ''}
                  onChange={(e) => handleChange('landing.features.1.desc', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="col-span-full font-bold text-slate-800">Feature 2: Monetisasi</div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={settings['landing.features.2.title'] || ''}
                  onChange={(e) => handleChange('landing.features.2.title', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={settings['landing.features.2.desc'] || ''}
                  onChange={(e) => handleChange('landing.features.2.desc', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="col-span-full font-bold text-slate-800">Feature 3: Absensi</div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={settings['landing.features.3.title'] || ''}
                  onChange={(e) => handleChange('landing.features.3.title', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={settings['landing.features.3.desc'] || ''}
                  onChange={(e) => handleChange('landing.features.3.desc', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="col-span-full font-bold text-slate-800">Feature 4: Dashboard</div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={settings['landing.features.4.title'] || ''}
                  onChange={(e) => handleChange('landing.features.4.title', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={settings['landing.features.4.desc'] || ''}
                  onChange={(e) => handleChange('landing.features.4.desc', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Showcase Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Showcase Section</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Headline</label>
              <input
                type="text"
                value={settings['landing.showcase.headline'] || ''}
                onChange={(e) => handleChange('landing.showcase.headline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Kelas & Aktivitas yang Telah Bergabung"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sub-headline</label>
              <textarea
                rows={2}
                value={settings['landing.showcase.subheadline'] || ''}
                onChange={(e) => handleChange('landing.showcase.subheadline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Lihat bagaimana para owner dan kreator memanfaatkan platform kami..."
              />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Featured Communities (Max 3)</h3>
              
              <div className="space-y-6">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-bold text-slate-800 mb-4">Community {num}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Slug / ID (URL Path)</label>
                        <input
                          type="text"
                          value={settings[`landing.showcase.${num}.id`] || ''}
                          onChange={(e) => handleChange(`landing.showcase.${num}.id`, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          placeholder="Misal: jakartarunners"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={settings[`landing.showcase.${num}.name`] || ''}
                          onChange={(e) => handleChange(`landing.showcase.${num}.name`, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Type / Category</label>
                        <input
                          type="text"
                          value={settings[`landing.showcase.${num}.type`] || ''}
                          onChange={(e) => handleChange(`landing.showcase.${num}.type`, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Image Upload</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(`landing.showcase.${num}.image`, e.target.files[0]);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {settings[`landing.showcase.${num}.image`] && (
                          <div className="mt-2 text-xs text-emerald-600 font-medium break-all">
                            ✓ Terupload: {settings[`landing.showcase.${num}.image`]}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={settings[`landing.showcase.${num}.desc`] || ''}
                          onChange={(e) => handleChange(`landing.showcase.${num}.desc`, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Footer CTA Section</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Headline</label>
              <input
                type="text"
                value={settings['landing.cta.headline'] || ''}
                onChange={(e) => handleChange('landing.cta.headline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Siap Melejitkan Bisnis Kelas & Aktivitas Anda?"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sub-headline</label>
              <textarea
                rows={3}
                value={settings['landing.cta.subheadline'] || ''}
                onChange={(e) => handleChange('landing.cta.subheadline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Bergabunglah dengan ratusan owner kursus..."
              />
            </div>
          </div>
        </div>

        {/* SEO & Analytics Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mt-12">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">SEO & Analytics</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Google Site Verification Code</label>
              <input
                type="text"
                value={settings['seo.google_site_verification'] || ''}
                onChange={(e) => handleChange('seo.google_site_verification', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 font-mono text-sm"
                placeholder="Misal: xyz123..."
              />
              <p className="text-xs text-slate-500 mt-2">Kode verifikasi meta tag dari Google Search Console.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Google Tag Manager ID</label>
              <input
                type="text"
                value={settings['seo.google_tag_manager'] || ''}
                onChange={(e) => handleChange('seo.google_tag_manager', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 font-mono text-sm"
                placeholder="Misal: GTM-XXXXXXX"
              />
              <p className="text-xs text-slate-500 mt-2">ID Container Google Tag Manager Anda. Memungkinkan tracking Google Analytics, Pixel, dll.</p>
            </div>
          </div>
        </div>


        {/* Danger Zone Section */}
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm mt-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-50 -mr-8 -mt-8"></div>
          
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-rose-100 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Danger Zone</h2>
              <p className="text-xs text-rose-500 font-bold mt-1">Gunakan dengan sangat hati-hati.</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
              <div>
                <h3 className="font-bold text-slate-900">Reset Seluruh Data Transaksi</h3>
                <p className="text-sm text-slate-600 mt-1 max-w-xl">
                  Ini akan secara permanen menghapus semua pendaftaran umum (Guest Registration), transaksi dompet anggota, 
                  riwayat aktivitas, dan mereset kuota partisipan di seluruh paket sesi. Tindakan ini <b>TIDAK DAPAT</b> dibatalkan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                disabled={resetting}
                className="shrink-0 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {resetting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Reset Semua Transaksi'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-10 py-4 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-indigo-600/30 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
            Save All Changes
          </button>
        </div>
      </form>

      <ConfirmModal 
        isOpen={isResetConfirmOpen}
        title="Reset Semua Data Transaksi"
        message="PERINGATAN KERAS: Tindakan ini akan menghapus semua Guest Registrations, Session Wallets, riwayat Check-in, dan mereset kuota semua paket kembali ke 0. Aksi ini bersifat permanen dan tidak dapat dibatalkan. Apakah Anda yakin?"
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleResetTransactions}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
