'use client';

import { useEffect, useState } from 'react';

import { getAuthHeaders } from '../../../lib/auth';
import { Save, Loader2, Globe, LayoutTemplate, Megaphone, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/system-settings', {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/system-settings', {
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
                        <label className="block text-xs font-bold text-slate-600 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={settings[`landing.showcase.${num}.image`] || ''}
                          onChange={(e) => handleChange(`landing.showcase.${num}.image`, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          placeholder="/images/example.png or https://..."
                        />
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
    </div>
  );
}
