'use client';
import { getApiUrl } from '../../../../lib/api';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../../lib/auth';
import { Save, Image as ImageIcon, X, Trash2, Pencil, Plus, ArrowUp, ArrowDown, UserRound, Palette, House, Menu, Phone, CreditCard, ClipboardList, Search, type LucideIcon } from 'lucide-react';
import { clubPalette } from '../../../../lib/club';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { Community, Membership } from '../../../../types';
import imageCompression from 'browser-image-compression';

const inputCls =
  'w-full rounded-xl border border-[#E6E6E0] bg-[#F6F6F2] px-4 py-3 font-medium outline-none transition-colors focus:border-[#111214] focus:bg-white';
const ghostBtn =
  'inline-flex items-center rounded-xl border border-[#E6E6E0] px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-[#F1F1EC]';

const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'profil', label: 'Profil', icon: UserRound },
  { id: 'tampilan', label: 'Tampilan', icon: Palette },
  { id: 'beranda', label: 'Beranda', icon: House },
  { id: 'menu', label: 'Nama menu', icon: Menu },
  { id: 'kontak', label: 'Kontak', icon: Phone },
  { id: 'pendaftaran', label: 'Pendaftaran', icon: CreditCard },
  { id: 'formulir', label: 'Formulir', icon: ClipboardList },
  { id: 'seo', label: 'Alamat & SEO', icon: Search },
];

function Section({ id, title, desc, children }: { id: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 rounded-3xl border border-[#E6E6E0] bg-white p-5 sm:p-7 lg:scroll-mt-24">
      <div className="mb-5 border-b border-[#EEEEE8] pb-4">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
      {hint && <span className="text-xs leading-relaxed text-slate-500">{hint}</span>}
    </div>
  );
}

/** Button-styled file picker for one image */
function FileButton({ label, onFile }: { label: string; onFile: (file: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center rounded-xl bg-[#111214] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2A2C30]">
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}

export default function AdminSettings({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', confirmText: 'Hapus', isDestructive: false, onConfirm: () => {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [qrisFile, setQrisFile] = useState<File | null>(null);
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
      const res = await fetch(`${getApiUrl()}/communities/${resolvedParams.slug}`);
      if (!res.ok) throw new Error('Klub tidak ditemukan');
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
      const tiersRes = await fetch(`${getApiUrl()}/membership-tier?communityId=${data.id}`, { headers });
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setMembershipTiers(tiersData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);

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
        const res = await fetch(`${getApiUrl()}/membership-tier/${editingTier.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal menyimpan paket membership');
      } else {
        // Create
        const res = await fetch(getApiUrl() + '/membership-tier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal membuat paket membership');
      }

      // Refresh list
      const tiersRes = await fetch(`${getApiUrl()}/membership-tier?communityId=${community.id}`, { headers });
      if (tiersRes.ok) {
        setMembershipTiers(await tiersRes.json());
      }
      setShowTierModal(false);
      setEditingTier(null);
      setTierForm({ name: '', durationDays: 30, price: 0 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
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

  const handleDeleteTierRequest = (id: string) => {
    setTierToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDeleteTier = async () => {
    if (!tierToDelete || !community) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/membership-tier/${tierToDelete}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Gagal menghapus paket membership');

      // Refresh list
      const tiersRes = await fetch(`${getApiUrl()}/membership-tier?communityId=${community.id}`, { headers });
      if (tiersRes.ok) {
        setMembershipTiers(await tiersRes.json());
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsConfirmModalOpen(false);
      setTierToDelete(null);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(getApiUrl() + '/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error('Gagal mengunggah file');
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
      let finalQrisUrl = community.qrisImageUrl;

      if (logoFile) {
        finalLogoUrl = await uploadFile(logoFile);
      }
      if (bannerFile) {
        finalBannerUrl = await uploadFile(bannerFile);
      } else if (community.heroBanner === '') {
        finalBannerUrl = '';
      }
      if (qrisFile) {
        finalQrisUrl = await uploadFile(qrisFile);
      } else if (community.qrisImageUrl === '') {
        finalQrisUrl = '';
      }

      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/communities/${community.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          name: community.name,
          tagline: community.tagline,
          slug: community.slug,
          shortDescription: community.shortDescription,
          about: community.about,
          contactInfo: community.contactInfo,
          whatsappNumber: community.whatsappNumber,
          logo: finalLogoUrl,
          heroBanner: finalBannerUrl,
          theme: community.theme,
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
          paymentInstructions: community.paymentInstructions,
          qrisImageUrl: finalQrisUrl,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan pengaturan');
      alert('Pengaturan tersimpan. Perubahan langsung tampil di halaman klub.');
      
      // If slug changed, we need to redirect
      if (community.slug !== resolvedParams.slug) {
        router.push(`/${community.slug}/admin/settings`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const compressBanner = async (file: File) => {
    try {
      setBannerFile(await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true }));
    } catch (err) {
      console.error('Error compressing image:', err);
      setBannerFile(file);
    }
  };

  const addCustomField = () => {
    const newField = {
      id: 'field_' + Math.random().toString(36).substr(2, 9),
      label: 'Pertanyaan baru',
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
    <div className="flex h-[60vh] items-center justify-center font-medium text-slate-400">Memuat pengaturan…</div>
  );

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 m-8 rounded-2xl">{error}</div>;

  if (!community) return <div className="p-8 text-center text-slate-500 font-bold">Klub tidak ditemukan.</div>;

  const set = (patch: Partial<Community>) => setCommunity({ ...community, ...patch });
  const theme = community.theme || '#E4572E';
  const logoSrc = logoFile ? URL.createObjectURL(logoFile) : community.logo || '';
  const bannerSrc = bannerFile ? URL.createObjectURL(bannerFile) : community.heroBanner || '';
  const qrisSrc = qrisFile ? URL.createObjectURL(qrisFile) : community.qrisImageUrl || '';
  const paid = community.registrationMode === 'PAID';

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Pengaturan Klub</h1>
        <p className="mt-2 text-slate-500">Atur semua yang tampil di halaman klub. Perubahan tampil setelah disimpan.</p>
      </div>

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
        {/* Section navigation */}
        <nav aria-label="Bagian pengaturan" className="sticky top-16 z-10 -mx-4 mb-5 overflow-x-auto bg-[#F6F6F2]/95 px-4 py-2 backdrop-blur lg:top-24 lg:mx-0 lg:mb-0 lg:self-start lg:bg-transparent lg:p-0">
          <ul className="flex gap-1.5 lg:flex-col lg:gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[#E6E6E0] bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 lg:rounded-xl lg:border-0 lg:bg-transparent lg:px-3 lg:hover:bg-white"
                >
                  <s.icon className="hidden h-4 w-4 text-slate-400 lg:block" />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <form onSubmit={handleSave} className="min-w-0 space-y-5">
          {/* Profil */}
          <Section id="profil" title="Profil klub" desc="Nama dan cerita klub yang dibaca calon member.">
            <Field label="Nama klub">
              <input type="text" required value={community.name || ''} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Tagline" hint="Kalimat pendek di bawah nama klub di beranda.">
              <input type="text" placeholder="Contoh: Lari bareng, tumbuh bareng." value={community.tagline || ''} onChange={(e) => set({ tagline: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Deskripsi singkat" hint="Satu-dua kalimat di beranda, di bawah tagline.">
              <textarea rows={2} value={community.shortDescription || ''} onChange={(e) => set({ shortDescription: e.target.value })} placeholder="Contoh: Komunitas lari Jakarta dengan sesi easy run dan long run setiap pekan." className={`${inputCls} resize-y`} />
            </Field>
            <Field label="Sambutan pengurus" hint="Kutipan dari pengurus, tampil di halaman Tentang. Boleh dikosongkan.">
              <textarea rows={2} value={community.welcomeMessage || ''} onChange={(e) => set({ welcomeMessage: e.target.value })} placeholder="Contoh: Selamat datang! Ayo lari bareng tiap pekan." className={`${inputCls} resize-y`} />
            </Field>
            <Field label="Tentang klub" hint="Cerita lengkap klub, tampil di halaman Tentang.">
              <textarea rows={6} value={community.about || ''} onChange={(e) => set({ about: e.target.value })} placeholder="Sejarah klub, jadwal rutin, coach, prestasi…" className={`${inputCls} resize-y`} />
            </Field>
          </Section>

          {/* Tampilan */}
          <Section id="tampilan" title="Logo & tampilan" desc="Logo, warna, dan foto utama halaman klub.">
            <Field label="Logo" hint="Gambar persegi, minimal 256 × 256 px. Juga dipakai di loader dan kartu member.">
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E6E6E0] bg-[#F6F6F2]">
                  {logoSrc ? <img src={logoSrc} alt="Logo klub" className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7 text-slate-300" />}
                </span>
                <div className="flex flex-wrap gap-2">
                  <FileButton label={logoSrc ? 'Ganti logo' : 'Pilih logo'} onFile={setLogoFile} />
                  {logoSrc && (
                    <button type="button" onClick={() => { setLogoFile(null); set({ logo: '' }); }} className={ghostBtn}>
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </Field>

            <Field label="Warna utama" hint="Dipakai untuk tombol dan aksen. Warna teks di atasnya menyesuaikan otomatis.">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#E6E6E0]" style={{ background: theme }}>
                  <input type="color" value={theme} onChange={(e) => set({ theme: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Pilih warna" />
                </label>
                <input
                  type="text"
                  value={community.theme || ''}
                  onChange={(e) => set({ theme: e.target.value })}
                  placeholder="#E4572E"
                  className="w-32 rounded-xl border border-[#E6E6E0] bg-[#F6F6F2] px-4 py-3 font-mono font-medium uppercase outline-none focus:border-[#111214] focus:bg-white"
                  aria-label="Kode warna"
                />
                <span className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-extrabold" style={{ background: theme, color: clubPalette(theme).on }}>
                  Contoh tombol
                </span>
              </div>
            </Field>

            <Field label="Foto utama beranda" hint="Foto lebar (landscape), misalnya 1600 × 1000 px. Dikompres otomatis.">
              {bannerSrc ? (
                <div className="relative overflow-hidden rounded-2xl border border-[#E6E6E0]">
                  <img src={bannerSrc} alt="Foto utama" className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]" />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <FileButton label="Ganti foto" onFile={compressBanner} />
                    <button type="button" onClick={() => { setBannerFile(null); set({ heroBanner: '' }); }} className={`${ghostBtn} bg-white`}>
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#E6E6E0] bg-[#F6F6F2] px-4 py-8 text-center">
                  <ImageIcon className="h-7 w-7 text-slate-300" />
                  <FileButton label="Pilih foto" onFile={compressBanner} />
                </div>
              )}
            </Field>
          </Section>

          {/* Beranda */}
          <Section id="beranda" title="Beranda" desc="Tombol dan angka di bagian atas halaman klub.">
            <Field label="Teks tombol gabung" hint="Tombol utama untuk mendaftar. Singkat saja, 2–3 kata.">
              <input type="text" value={community.joinCtaLabel || ''} onChange={(e) => set({ joinCtaLabel: e.target.value })} placeholder="Gabung Klub" className="w-full rounded-xl border border-[#E6E6E0] bg-[#F6F6F2] px-4 py-3 font-medium outline-none transition-colors focus:border-[#111214] focus:bg-white sm:max-w-xs" />
            </Field>
            <Field label="Angka statistik" hint="Empat angka di beranda. Kosongkan untuk memakai data asli (misalnya jumlah member).">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  ['statMembersValue', 'Member', '150+'],
                  ['statEventsValue', 'Kegiatan', '45+'],
                  ['statCitiesValue', 'Kota', '3'],
                  ['statAchievementsValue', 'Prestasi', '10+'],
                ] as const).map(([key, lbl, ph]) => (
                  <label key={key} className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">{lbl}</span>
                    <input type="text" value={community[key] || ''} onChange={(e) => set({ [key]: e.target.value } as Partial<Community>)} placeholder={ph} className={inputCls} />
                  </label>
                ))}
              </div>
            </Field>
          </Section>

          {/* Menu */}
          <Section id="menu" title="Nama menu" desc="Ganti nama menu di halaman klub. Kosongkan untuk nama bawaan.">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              {([
                ['menuHomeLabel', 'Menu Beranda', 'Beranda'],
                ['menuEventsLabel', 'Menu Paket', 'Paket'],
                ['menuGalleryLabel', 'Menu Galeri', 'Galeri'],
                ['menuAboutLabel', 'Menu Tentang', 'Tentang'],
                ['menuContactLabel', 'Menu Kontak', 'Kontak'],
                ['packagesHeadingLabel', 'Judul halaman Paket', 'Sama dengan Menu Paket'],
              ] as const).map(([key, lbl, ph]) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-slate-700">{lbl}</span>
                  <input type="text" value={community[key] || ''} onChange={(e) => set({ [key]: e.target.value } as Partial<Community>)} placeholder={ph} className={inputCls} />
                </label>
              ))}
            </div>
          </Section>

          {/* Kontak */}
          <Section id="kontak" title="Kontak" desc="Ditampilkan di halaman Kontak dan tombol Chat WhatsApp.">
            <Field label="Nomor WhatsApp pengurus">
              <input type="tel" value={community.whatsappNumber || ''} onChange={(e) => set({ whatsappNumber: e.target.value })} placeholder="081234567890" className={inputCls} />
            </Field>
            <Field label="Info kontak lain" hint="Alamat sekretariat, email, media sosial, dan lainnya.">
              <textarea rows={4} value={community.contactInfo || ''} onChange={(e) => set({ contactInfo: e.target.value })} placeholder={'Sekretariat: Pintu 7 GBK, Senayan\nInstagram: @namaklub'} className={`${inputCls} resize-y`} />
            </Field>
          </Section>

          {/* Pendaftaran & pembayaran */}
          <Section id="pendaftaran" title="Pendaftaran & pembayaran" desc="Cara calon member bergabung dan membayar.">
            <Field label="Tipe pendaftaran">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  ['FREE', 'Gratis', 'Calon member cukup isi formulir, lalu disetujui pengurus. Bayar per paket latihan.'],
                  ['PAID', 'Berbayar', 'Calon member wajib memilih dan membayar paket membership saat mendaftar.'],
                ] as const).map(([value, title, desc]) => {
                  const on = (community.registrationMode || 'FREE') === value;
                  return (
                    <label key={value} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${on ? 'border-[#111214] bg-[#F6F6F2]' : 'border-[#E6E6E0] hover:bg-[#FAFAF7]'}`}>
                      <input type="radio" name="registrationMode" value={value} checked={on} onChange={() => set({ registrationMode: value })} className="mt-1 h-4 w-4 accent-[#111214]" />
                      <span className="flex flex-col gap-0.5">
                        <b className="text-[15px] text-slate-900">{title}</b>
                        <span className="text-sm leading-snug text-slate-500">{desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field
              label="Paket membership"
              hint={paid ? 'Wajib ada minimal satu paket untuk pendaftaran berbayar.' : 'Opsional. Dipakai untuk paket latihan bertanda “Perlu membership”.'}
            >
              <div className="overflow-hidden rounded-2xl border border-[#E6E6E0]">
                {membershipTiers.map((tier) => (
                  <div key={tier.id} className="flex items-center justify-between gap-3 border-b border-[#EEEEE8] px-4 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-900">{tier.name}</div>
                      <div className="text-xs text-slate-500">
                        {tier.durationDays} hari · Rp {tier.price?.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => handleEditTierClick(tier)} className="rounded-lg p-2 text-slate-500 hover:bg-[#F1F1EC]" aria-label={`Edit ${tier.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDeleteTierRequest(tier.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label={`Hapus ${tier.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {membershipTiers.length === 0 && <div className="px-4 py-5 text-center text-sm text-slate-400">Belum ada paket membership.</div>}
                <button
                  type="button"
                  onClick={() => {
                    setEditingTier(null);
                    setTierForm({ name: '', durationDays: 30, price: 0 });
                    setShowTierModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 border-t border-[#EEEEE8] bg-[#FAFAF7] px-4 py-3 text-sm font-bold text-slate-700 hover:bg-[#F1F1EC]"
                >
                  <Plus className="h-4 w-4" /> Tambah paket membership
                </button>
              </div>
            </Field>

            <Field label="Instruksi pembayaran" hint="Muncul saat member membeli paket atau mendaftar berbayar.">
              <textarea
                rows={4}
                value={community.paymentInstructions || ''}
                onChange={(e) => set({ paymentInstructions: e.target.value })}
                placeholder={'Transfer ke BCA 123456789 a.n. Kas Klub,\nlalu unggah bukti transfer.'}
                className={`${inputCls} resize-y`}
              />
            </Field>

            <Field label="QRIS (opsional)" hint="Ditampilkan di samping instruksi pembayaran.">
              <div className="flex items-center gap-4">
                <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E6E6E0] bg-[#F6F6F2]">
                  {qrisSrc ? <img src={qrisSrc} alt="QRIS" className="h-full w-full object-contain" /> : <ImageIcon className="h-7 w-7 text-slate-300" />}
                </span>
                <div className="flex flex-wrap gap-2">
                  <FileButton
                    label={qrisSrc ? 'Ganti QRIS' : 'Pilih gambar QRIS'}
                    onFile={async (file) => setQrisFile(await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: true }))}
                  />
                  {qrisSrc && (
                    <button type="button" onClick={() => { setQrisFile(null); set({ qrisImageUrl: '' }); }} className={ghostBtn}>
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </Field>
          </Section>

          {/* Formulir pendaftaran */}
          <Section id="formulir" title="Formulir pendaftaran" desc="Nama, email, dan nomor HP selalu ditanyakan. Tambahkan pertanyaan lain bila perlu, misalnya ukuran jersey atau kontak darurat.">
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={field.id} className="rounded-2xl border border-[#E6E6E0] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F1F1EC] text-xs font-bold text-slate-600">{index + 1}</span>
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                      <input
                        type="text"
                        required
                        value={field.label}
                        onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                        placeholder="Tulis pertanyaan"
                        aria-label={`Pertanyaan ${index + 1}`}
                        className={inputCls}
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateCustomField(field.id, { type: e.target.value, options: e.target.value === 'select' ? [] : undefined })}
                        aria-label="Jenis jawaban"
                        className={inputCls}
                      >
                        <option value="text">Teks singkat</option>
                        <option value="textarea">Teks panjang</option>
                        <option value="number">Angka</option>
                        <option value="select">Pilihan (dropdown)</option>
                      </select>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mt-3 flex flex-wrap gap-2 pl-9">
                      {(field.options || []).map((opt, optIndex) => (
                        <span key={optIndex} className="flex items-center rounded-full border border-[#E6E6E0] bg-[#F6F6F2] py-1 pl-3 pr-1.5 text-sm">
                          <input
                            type="text"
                            value={opt}
                            required
                            onChange={(e) => {
                              const newOpts = [...(field.options || [])];
                              newOpts[optIndex] = e.target.value;
                              updateCustomField(field.id, { options: newOpts });
                            }}
                            aria-label={`Pilihan ${optIndex + 1}`}
                            className="w-24 border-0 bg-transparent p-0 text-sm font-medium outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateCustomField(field.id, { options: (field.options || []).filter((_, i) => i !== optIndex) })}
                            className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-white hover:text-slate-700"
                            aria-label="Hapus pilihan"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateCustomField(field.id, { options: [...(field.options || []), `Pilihan ${(field.options || []).length + 1}`] })}
                        className="rounded-full border border-dashed border-[#D9D9D2] px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-[#F6F6F2]"
                      >
                        + Pilihan
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EEEEE8] pt-3 pl-9">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateCustomField(field.id, { required: e.target.checked })} className="h-4 w-4 accent-[#111214]" />
                      Wajib diisi
                    </label>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-[#F1F1EC] disabled:opacity-30" aria-label="Pindah ke atas">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => moveField(index, 'down')} disabled={index === customFields.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-[#F1F1EC] disabled:opacity-30" aria-label="Pindah ke bawah">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeCustomField(field.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50" aria-label="Hapus pertanyaan">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCustomField}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D9D9D2] py-3.5 text-sm font-bold text-slate-600 hover:bg-[#FAFAF7]"
              >
                <Plus className="h-4 w-4" /> Tambah pertanyaan
              </button>
            </div>
          </Section>

          {/* Alamat & SEO */}
          <Section id="seo" title="Alamat & pencarian" desc="Alamat halaman klub dan tampilannya di Google. Boleh dibiarkan.">
            <Field label="Alamat halaman" hint="Mengubahnya membuat link lama tidak berlaku lagi.">
              <div className="flex items-stretch overflow-hidden rounded-xl border border-[#E6E6E0] bg-[#F6F6F2] focus-within:border-[#111214]">
                <span className="flex items-center border-r border-[#E6E6E0] px-3 text-sm font-semibold text-slate-500">latih.club/</span>
                <input
                  type="text"
                  required
                  value={community.slug || ''}
                  onChange={(e) => set({ slug: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 font-medium outline-none"
                  aria-label="Slug"
                />
              </div>
            </Field>
            <Field label="Judul di hasil pencarian" hint="Kosongkan untuk memakai nama klub.">
              <input type="text" value={community.seoTitle || ''} onChange={(e) => set({ seoTitle: e.target.value })} placeholder={`${community.name} — Komunitas di …`} className={inputCls} />
            </Field>
            <Field label="Deskripsi di hasil pencarian" hint="Juga muncul saat link dibagikan di WhatsApp.">
              <textarea rows={3} value={community.seoDescription || ''} onChange={(e) => set({ seoDescription: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
            <Field label="Kata kunci" hint="Pisahkan dengan koma.">
              <input type="text" value={community.seoKeywords || ''} onChange={(e) => set({ seoKeywords: e.target.value })} placeholder="komunitas lari, lari jakarta" className={inputCls} />
            </Field>
          </Section>

          <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t border-[#E6E6E0] bg-[#F6F6F2]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white/95 sm:px-5">
            <p className="text-sm text-slate-500">Perubahan tampil setelah disimpan.</p>
            <button
              type="submit"
              disabled={saving}
              className="flex shrink-0 items-center rounded-xl bg-[#111214] px-6 py-3 font-bold text-white transition-colors hover:bg-[#2A2C30] disabled:opacity-50"
            >
              <Save className="mr-2 h-5 w-5" />
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>


      {/* Add / Edit Membership Tier Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Hapus Paket Membership"
        message="Apakah Anda yakin ingin menghapus paket membership ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        isDestructive={true}
        onConfirm={handleConfirmDeleteTier}
        onCancel={() => setIsConfirmModalOpen(false)}
      />

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
                  placeholder="Contoh: Membership Bulanan"
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
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        isDestructive={confirmModalConfig.isDestructive}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
      />
    </div>
  );
}
