# 09 CMS (Content Management System)

## Purpose
Mendokumentasikan fitur sistem manajemen konten (*CMS*) untuk *microsite* masing-class komunitas.

## Ruang Lingkup (MVP)
CMS ini dirancang sederhana agar Community Admin dapat dengan mudah mengatur tampilan halaman profil publik komunitas tanpa perlu keahlian *coding*.

### 1. Halaman yang Dapat Dikelola
- **Home:** Mengatur konten *Hero Banner* (gambar, *tagline*, deskripsi singkat) dan mengatur *layout widget* (seperti *Upcoming Events* atau *Latest News*).
- **About:** Penjelasan profil sejarah, visi, dan misi komunitas.
- **Contact:** Form kontak, tautan sosial media, dan lokasi/alamat sekretariat.
- **FAQ:** Halaman *Frequently Asked Questions* untuk menjawab pertanyaan umum calon anggota baru.

### 2. Gallery
Terintegrasi dengan halaman Home atau memiliki halaman khusus. CMS mengizinkan pengelolaan media (unggah foto atau memasukkan ID Video YouTube).

### 3. Tema (*Settings*)
Terintegrasi dengan sistem Multi-tenant. Admin dapat mengubah warna dominan (*Color Theme*) yang akan langsung diterapkan secara global pada *microsite* komunitas tersebut melalui *Tailwind CSS variables*.
