// Landing page copy. Super Admin can override each key from Settings;
// an empty value falls back to the default below.
export const HOME_DEFAULTS = {
  'home.whatsapp': '6287722125859',
  'home.whatsapp.message': 'Halo tim Latih.Club, saya ingin mendaftarkan klub saya',

  'home.hero.badge': 'Pesan untuk rombongan, sampai 6 orang sekaligus',
  'home.hero.headline': 'Kelola klub latihan dari HP,',
  'home.hero.highlight': 'bukan spreadsheet.',
  'home.hero.subheadline':
    'Pendaftaran, paket latihan, pembayaran, dan absensi — semua di satu tempat. Member senang, coach fokus, owner tenang.',
  'home.hero.note': 'Pendaftaran klub dibantu langsung oleh tim kami lewat WhatsApp.',

  'home.features.headline': 'Satu sistem untuk semua orang di klubmu.',
  'home.features.subheadline':
    'Owner, coach, dan member masing-masing punya tampilan sendiri — semuanya tersambung otomatis.',
  'home.tile.owner.title': 'Dashboard yang langsung kebaca',
  'home.tile.owner.desc':
    'Pendapatan, jumlah member, tren check-in harian, dan paket yang hampir habis — sekali lihat.',
  'home.tile.group.title': 'Satu bayar, sampai 6 orang',
  'home.tile.group.desc': 'Daftarkan anak, keluarga, atau teman. Tiap peserta dapat sesi atas namanya.',
  'home.tile.coach.title': 'Absen dari pinggir lapangan',
  'home.tile.coach.desc': 'Daftar peserta & sisa sesi, tinggal tap Check-in.',
  'home.tile.packages.title': 'Jual paket latihanmu',
  'home.tile.packages.desc': 'Harga umum, private, khusus member — kuota penuh otomatis waiting list.',
  'home.tile.member.title': 'Check-in sendiri',
  'home.tile.member.desc': 'Sisa sesi, masa berlaku, dan riwayat hadir di My Hub.',

  'home.clubs.headline': 'Klub yang sudah jalan',
  'home.blog.headline': 'Tips seputar klub & latihan',

  'home.cta.headline': 'Saatnya klubmu',
  'home.cta.highlight': 'naik kelas.',
  'home.cta.subheadline':
    'Chat tim kami, klubmu kami siapkan — kamu tinggal susun paket dan bagikan link-nya ke member.',
} as const;

export type HomeKey = keyof typeof HOME_DEFAULTS;

export function homeText(settings: Record<string, string>, key: HomeKey): string {
  return settings[key]?.trim() || HOME_DEFAULTS[key];
}

export function whatsappUrl(settings: Record<string, string>, withMessage = true): string {
  const number = homeText(settings, 'home.whatsapp').replace(/\D/g, '');
  if (!withMessage) return `https://wa.me/${number}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(homeText(settings, 'home.whatsapp.message'))}`;
}

// Field layout for the Super Admin settings form
export const HOME_FIELD_GROUPS: {
  title: string;
  fields: { key: HomeKey; label: string; multiline?: boolean }[];
}[] = [
  {
    title: 'Pendaftaran Klub (WhatsApp)',
    fields: [
      { key: 'home.whatsapp', label: 'Nomor WhatsApp (format 62…)' },
      { key: 'home.whatsapp.message', label: 'Pesan otomatis' },
    ],
  },
  {
    title: 'Hero',
    fields: [
      { key: 'home.hero.badge', label: 'Badge "Baru"' },
      { key: 'home.hero.headline', label: 'Headline baris 1' },
      { key: 'home.hero.highlight', label: 'Headline baris 2 (bergaris bawah)' },
      { key: 'home.hero.subheadline', label: 'Sub-headline', multiline: true },
      { key: 'home.hero.note', label: 'Catatan di bawah tombol' },
    ],
  },
  {
    title: 'Fitur (Bento)',
    fields: [
      { key: 'home.features.headline', label: 'Judul bagian' },
      { key: 'home.features.subheadline', label: 'Deskripsi bagian', multiline: true },
      { key: 'home.tile.owner.title', label: 'Tile Owner — judul' },
      { key: 'home.tile.owner.desc', label: 'Tile Owner — deskripsi', multiline: true },
      { key: 'home.tile.group.title', label: 'Tile Pesanan Grup — judul' },
      { key: 'home.tile.group.desc', label: 'Tile Pesanan Grup — deskripsi', multiline: true },
      { key: 'home.tile.coach.title', label: 'Tile Coach — judul' },
      { key: 'home.tile.coach.desc', label: 'Tile Coach — deskripsi', multiline: true },
      { key: 'home.tile.packages.title', label: 'Tile Paket — judul' },
      { key: 'home.tile.packages.desc', label: 'Tile Paket — deskripsi', multiline: true },
      { key: 'home.tile.member.title', label: 'Tile Member — judul' },
      { key: 'home.tile.member.desc', label: 'Tile Member — deskripsi', multiline: true },
    ],
  },
  {
    title: 'Klub, Blog & Penutup',
    fields: [
      { key: 'home.clubs.headline', label: 'Judul bagian Klub' },
      { key: 'home.blog.headline', label: 'Judul bagian Blog' },
      { key: 'home.cta.headline', label: 'Penutup — headline' },
      { key: 'home.cta.highlight', label: 'Penutup — kata berwarna' },
      { key: 'home.cta.subheadline', label: 'Penutup — deskripsi', multiline: true },
    ],
  },
];
