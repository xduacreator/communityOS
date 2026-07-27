'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../../lib/auth';
import { Settings, Save, Globe, Type, Info, Phone, Image as ImageIcon, BarChart2, Search, X } from 'lucide-react';
import { Community, Membership } from '../../../../types';

export default function AdminSettings({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [customFields, setCustomFields] = useState<{ id: string; label: string; type: string; required: boolean; options?: string[] }[]>([]);
  const router = useRouter();

  // Membership Tiers manager states
  const [membershipTiers, setMembershipTiers] = useState<Membership[]>([]);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Membership | null>(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    durationDays: 30,
    price: 0,
  });

  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${resolvedParams.slug}`);
      if (!res.ok) throw new Error('Community not found');
      const data = await res.json() as Community;
      setCommunity(data);
      if (data.registrationFields) {
        try {
          setCustomFields(JSON.parse(data.registrationFields));
        } catch (e) {
          setCustomFields([]);
        }
      }

      // Fetch active membership packages/tiers
      const headers = getAuthHeaders();
      const tiersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/membership-tier?communityId=${data.id}`, { headers });
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setMembershipTiers(tiersData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.slug]);

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    try {
      const headers = getAuthHeaders();
      const payload = {
        communityId: community.id,
        name: tierForm.name,
        durationDays: Number(tierForm.durationDays),
        price: Number(tierForm.price),
        status: 'ACTIVE',
      };

      if (editingTier) {
        // Update
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/membership-tier/${editingTier.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update membership tier');
      } else {
        // Create
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/membership-tier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create membership tier');
      }

      // Refresh list
      const tiersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/membership-tier?communityId=${community.id}`, { headers });
      if (tiersRes.ok) {
        setMembershipTiers(await tiersRes.json());
      }
      setShowTierModal(false);
      setEditingTier(null);
      setTierForm({ name: '', durationDays: 30, price: 0 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEditTierClick = (tier: Membership) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      durationDays: tier.durationDays,
      price: tier.price,
    });
    setShowTierModal(true);
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket membership ini?')) return;
    if (!community) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/membership-tier/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete membership tier');

      // Refresh list
      const tiersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/membership-tier?communityId=${community.id}`, { headers });
      if (tiersRes.ok) {
        setMembershipTiers(await tiersRes.json());
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    const data = await res.json();
    return data.url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    setSaving(true);
    try {
      let finalLogoUrl = community.logo;
      let finalBannerUrl = community.heroBanner;

      if (logoFile) {
        finalLogoUrl = await uploadFile(logoFile);
      }
      if (bannerFile) {
        finalBannerUrl = await uploadFile(bannerFile);
      }

      const headers = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/${community.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          name: community.name,
          tagline: community.tagline,
          slug: community.slug,
          domain: community.domain,
          shortDescription: community.shortDescription,
          about: community.about,
          contactInfo: community.contactInfo,
          whatsappNumber: community.whatsappNumber,
          logo: finalLogoUrl,
          heroBanner: finalBannerUrl,
          statMembersValue: community.statMembersValue,
          statEventsValue: community.statEventsValue,
          statCitiesValue: community.statCitiesValue,
          statAchievementsValue: community.statAchievementsValue,
          welcomeMessage: community.welcomeMessage,
          joinCtaLabel: community.joinCtaLabel,
          menuHomeLabel: community.menuHomeLabel,
          menuEventsLabel: community.menuEventsLabel,
          menuGalleryLabel: community.menuGalleryLabel,
          menuAboutLabel: community.menuAboutLabel,
          menuContactLabel: community.menuContactLabel,
          packagesHeadingLabel: community.packagesHeadingLabel,
          seoTitle: community.seoTitle,
          seoDescription: community.seoDescription,
          seoKeywords: community.seoKeywords,
          registrationFields: JSON.stringify(customFields),
          registrationMode: community.registrationMode || "FREE",
        }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      alert('Settings updated successfully!');
      
      // If slug changed, we need to redirect
      if (community.slug !== resolvedParams.slug) {
        router.push(`/${community.slug}/admin/settings`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = () => {
    const newField = {
      id: 'field_' + Math.random().toString(36).substr(2, 9),
      label: 'New Field',
      type: 'text',
      required: false,
      options: [],
    };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const updateCustomField = (id: string, updates: Partial<{ id: string; label: string; type: string; required: boolean; options?: string[] }>) => {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customFields.length) return;
    const updated = [...customFields];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setCustomFields(updated);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
        <div className="text-slate-400 font-medium">Loading Settings...</div>
      </div>
    </div>
  );

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 m-8 rounded-2xl">{error}</div>;

  if (!community) return <div className="p-8 text-center text-slate-500 font-bold">Community not found.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Community Settings</h1>
          <p className="mt-2 text-slate-500">Manage your community&apos;s public profile</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <Settings className="w-6 h-6 text-indigo-500" />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-8 space-y-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* General Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                 <Type className="w-5 h-5 mr-2 text-indigo-500" /> General Information
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Community Name</label>
                <input
                  type="text"
                  required
                  value={community.name || ''}
                  onChange={(e) => setCommunity({ ...community, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tagline (Subtext)</label>
                <input
                  type="text"
                  placeholder="e.g. Komunitas Pecinta Alam Indonesia"
                  value={community.tagline || ''}
                  onChange={(e) => setCommunity({ ...community, tagline: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
                <p className="text-xs text-slate-500 mt-2">Short text displayed under your community name (on mobile header).</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">URL Slug</label>
                <input
                  type="text"
                  required
                  value={community.slug || ''}
                  onChange={(e) => setCommunity({ ...community, slug: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
                <p className="text-xs text-slate-500 mt-2">This is the path used to access your community (e.g., /my-community)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Custom Domain</label>
                <input
                  type="text"
                  value={community.domain || ''}
                  onChange={(e) => setCommunity({ ...community, domain: e.target.value })}
                  placeholder="e.g., mycommunity.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipe Pendaftaran Anggota</label>
                <select
                  value={community.registrationMode || 'FREE'}
                  onChange={(e) => setCommunity({ ...community, registrationMode: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700"
                >
                  <option value="FREE">Pendaftaran Gratis (Free Registration)</option>
                  <option value="PAID">Pendaftaran Berbayar (Paid Membership Tier Upfront)</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">Diferensiasi tipe join apakah calon member bisa langsung daftar gratis atau wajib berlangganan di awal.</p>
              </div>

              {community.registrationMode === 'PAID' && (
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Paket Membership Komunitas</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTier(null);
                        setTierForm({ name: '', durationDays: 30, price: 0 });
                        setShowTierModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      + Tambah Paket
                    </button>
                  </div>
                  {membershipTiers.length > 0 ? (
                    <div className="space-y-2">
                      {membershipTiers.map((tier) => (
                        <div key={tier.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                          <div>
                            <div className="text-sm font-bold text-slate-800">{tier.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Durasi: {tier.durationDays} hari</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-indigo-600">Rp {tier.price?.toLocaleString('id-ID')}</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditTierClick(tier)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTier(tier.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 font-medium text-xs bg-white border border-dashed border-slate-200 rounded-xl">
                      Belum ada paket membership. Tambah paket untuk membatasi pendaftaran berbayar.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <Info className="w-5 h-5 mr-2 text-indigo-500" /> Profile Details
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Welcome Message</label>
                <input
                  type="text"
                  value={community.welcomeMessage || ''}
                  onChange={(e) => setCommunity({ ...community, welcomeMessage: e.target.value })}
                  placeholder="Welcome to"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
                <p className="text-xs text-slate-500 mt-2">The text displayed above the community name on the profile page.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tombol Gabung (Join CTA)</label>
                <input
                  type="text"
                  value={community.joinCtaLabel || ''}
                  onChange={(e) => setCommunity({ ...community, joinCtaLabel: e.target.value })}
                  placeholder="Gabung Komunitas"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
                <p className="text-xs text-slate-500 mt-2">Teks yang ditampilkan pada tombol utama untuk mendaftar atau gabung.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Short Description</label>
                <textarea
                  rows={2}
                  value={community.shortDescription || ''}
                  onChange={(e) => setCommunity({ ...community, shortDescription: e.target.value })}
                  placeholder="Komunitas yang menghubungkan orang, berbagi pengetahuan..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">Teks singkat yang akan tampil di halaman utama (Home) Landing Profile.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Description (About)</label>
                <textarea
                  rows={4}
                  value={community.about || ''}
                  onChange={(e) => setCommunity({ ...community, about: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">Teks penjelasan lengkap yang akan tampil di tab About.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-slate-400" /> Contact Info
                </label>
                <textarea
                  rows={4}
                  value={community.contactInfo || ''}
                  onChange={(e) => setCommunity({ ...community, contactInfo: e.target.value })}
                  placeholder="e.g. Email: hello@community.com&#10;Phone: +62 812...&#10;Address: Jakarta"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium resize-y min-h-[120px]"
                />
                <p className="text-xs text-slate-500 mt-2">Enter any contact details (email, phone, address). This will be shown on the Contact tab.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  value={community.whatsappNumber || ''}
                  onChange={(e) => setCommunity({ ...community, whatsappNumber: e.target.value })}
                  placeholder="e.g. 6281234567890 (Gunakan kode negara tanpa +)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
                <p className="text-xs text-slate-500 mt-2">Will be displayed as a clickable wa.me link on the Contact tab.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Branding */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-indigo-500" /> Branding
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Logo Upload</label>
                {(logoFile || community.logo) && (
                  <img 
                    src={logoFile ? URL.createObjectURL(logoFile) : (community.logo || undefined)} 
                    alt="Logo Preview" 
                    className="w-24 h-24 object-cover rounded-xl mb-4 shadow-sm border border-slate-200"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLogoFile(e.target.files[0]);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-slate-500 mt-2">Recommended size: 256x256px</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Hero Banner Upload</label>
                {(bannerFile || community.heroBanner) && (
                  <img 
                    src={bannerFile ? URL.createObjectURL(bannerFile) : (community.heroBanner || undefined)} 
                    alt="Banner Preview" 
                    className="w-full h-32 object-cover rounded-xl mb-4 shadow-sm border border-slate-200"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setBannerFile(e.target.files[0]);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-slate-500 mt-2">Background image for the profile header</p>
              </div>
            </div>

            {/* Menu Labels */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-indigo-500" /> Custom Menu Labels
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Home Menu</label>
                  <input
                    type="text"
                    value={community.menuHomeLabel || ''}
                    onChange={(e) => setCommunity({ ...community, menuHomeLabel: e.target.value })}
                    placeholder="home"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Events Menu</label>
                  <input
                    type="text"
                    value={community.menuEventsLabel || ''}
                    onChange={(e) => setCommunity({ ...community, menuEventsLabel: e.target.value })}
                    placeholder="events"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Gallery Menu</label>
                  <input
                    type="text"
                    value={community.menuGalleryLabel || ''}
                    onChange={(e) => setCommunity({ ...community, menuGalleryLabel: e.target.value })}
                    placeholder="gallery"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">About Menu</label>
                  <input
                    type="text"
                    value={community.menuAboutLabel || ''}
                    onChange={(e) => setCommunity({ ...community, menuAboutLabel: e.target.value })}
                    placeholder="about"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Menu</label>
                  <input
                    type="text"
                    value={community.menuContactLabel || ''}
                    onChange={(e) => setCommunity({ ...community, menuContactLabel: e.target.value })}
                    placeholder="contact"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Packages Heading (Microsite)</label>
                  <input
                    type="text"
                    value={community.packagesHeadingLabel || ''}
                    onChange={(e) => setCommunity({ ...community, packagesHeadingLabel: e.target.value })}
                    placeholder="Available Session Packages"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                  <p className="text-xs text-slate-500 mt-2">Title displayed above the packages list on the community profile.</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-indigo-500" /> Statistics Display (Vanity Metrics)
              </h3>
              <p className="text-sm text-slate-500 mb-4">These values will be shown on your community&apos;s floating stats bar. Leave blank to use defaults or real data where applicable.</p>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Members Display (e.g. &quot;1,250+&quot;)</label>
                <input
                  type="text"
                  placeholder="e.g. 5,000+"
                  value={community.statMembersValue || ''}
                  onChange={(e) => setCommunity({ ...community, statMembersValue: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Events Display</label>
                  <input
                    type="text"
                    placeholder="e.g. 45+"
                    value={community.statEventsValue || ''}
                    onChange={(e) => setCommunity({ ...community, statEventsValue: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Cities Display</label>
                  <input
                    type="text"
                    placeholder="e.g. 12"
                    value={community.statCitiesValue || ''}
                    onChange={(e) => setCommunity({ ...community, statCitiesValue: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Achievements</label>
                  <input
                    type="text"
                    placeholder="e.g. 20+"
                    value={community.statAchievementsValue || ''}
                    onChange={(e) => setCommunity({ ...community, statAchievementsValue: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SEO Configuration */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                <Search className="w-5 h-5 mr-2 text-indigo-500" /> SEO & Search Configuration
              </h3>
              <p className="text-sm text-slate-500 mb-4">Make your community page easily discoverable by Search Engines and AI Search bots (like ChatGPT, Claude, Gemini).</p>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">SEO Title</label>
                <input
                  type="text"
                  placeholder="e.g. Official Community of Tech Enthusiasts"
                  value={community.seoTitle || ''}
                  onChange={(e) => setCommunity({ ...community, seoTitle: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
                <p className="text-xs text-slate-500 mt-2">Will appear as the page title in search results. Defaults to your community name.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">SEO Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Join the largest gathering of tech enthusiasts. Share ideas, attend events, and grow together."
                  value={community.seoDescription || ''}
                  onChange={(e) => setCommunity({ ...community, seoDescription: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">A short summary snippet shown in search results or when shared on social media.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Keywords</label>
                <input
                  type="text"
                  placeholder="e.g. tech, community, programming, network"
                  value={community.seoKeywords || ''}
                  onChange={(e) => setCommunity({ ...community, seoKeywords: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Custom Registration Form Builder */}
          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-indigo-500" /> Custom Registration Fields
            </h3>
            <p className="text-sm text-slate-500">Configure what additional information members must provide when they request to join this community.</p>

            <div className="space-y-4">
              {customFields.map((field, index) => (
                <div key={field.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative group">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-lg text-xs">
                        Field #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-200 text-slate-500 rounded disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(index, 'down')}
                        disabled={index === customFields.length - 1}
                        className="p-1 hover:bg-slate-200 text-slate-500 rounded disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="text-rose-500 hover:text-rose-700 font-bold text-sm bg-rose-50 px-3 py-1 rounded-xl"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Field Label</label>
                      <input
                        type="text"
                        required
                        value={field.label}
                        onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Input Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateCustomField(field.id, { type: e.target.value, options: e.target.value === 'select' ? [] : undefined })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                      >
                        <option value="text">Text (Single Line)</option>
                        <option value="textarea">Text Area (Multi Line)</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown Select</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span className="text-sm font-semibold text-slate-700">Required Field</span>
                      </label>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Dropdown Options</label>
                      <div className="flex flex-wrap gap-2">
                        {(field.options || []).map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 text-sm font-medium">
                            <input
                              type="text"
                              value={opt}
                              required
                              onChange={(e) => {
                                const newOpts = [...(field.options || [])];
                                newOpts[optIndex] = e.target.value;
                                updateCustomField(field.id, { options: newOpts });
                              }}
                              className="bg-transparent border-0 focus:ring-0 outline-none p-0 font-medium text-sm w-24 text-indigo-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = (field.options || []).filter((_, i) => i !== optIndex);
                                updateCustomField(field.id, { options: newOpts });
                              }}
                              className="ml-2 text-indigo-400 hover:text-indigo-700 font-extrabold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = [...(field.options || []), 'Option'];
                            updateCustomField(field.id, { options: newOpts });
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {customFields.length === 0 && (
                <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-medium">
                  No custom fields added yet. Calon member will only fill out standard registration info.
                </div>
              )}

              <button
                type="button"
                onClick={addCustomField}
                className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 hover:border-indigo-400 hover:text-indigo-700 transition-all font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                + Add Custom Field
              </button>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 text-lg"
            >
              <Save className="w-5 h-5 mr-3" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Add / Edit Membership Tier Modal */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingTier ? 'Edit Paket Membership' : 'Tambah Paket Membership'}</h3>
                <p className="text-xs text-slate-500 mt-1">Konfigurasi nama, durasi aktif, dan harga paket.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowTierModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-left">Nama Paket</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Bronze Membership, Silver, Gold"
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-left">Durasi (Hari)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={tierForm.durationDays}
                    onChange={(e) => setTierForm({ ...tierForm, durationDays: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-left">Harga (Rupiah)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={tierForm.price}
                    onChange={(e) => setTierForm({ ...tierForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {editingTier ? 'Simpan Perubahan' : 'Tambah Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
