# 01 PRD

## Purpose
Merangkum spesifikasi utama dan scope MVP dari CommunityOS.

## MVP Scope (Phase 1)
Fitur-fitur utama yang akan dirilis pada fase MVP (Minimum Viable Product):

### 1. Community Management
Super Admin dapat membuat entitas komunitas dengan data dasar (Name, Slug, Logo, Admin Email, Plan). Hasil dari proses ini adalah penyediaan microsite dinamis (misal: `community.id/jakartarunners`).

### 2. CMS (Content Management System)
Community Admin memiliki kapabilitas untuk mengelola halaman publik:
- Home
- About
- Contact
- FAQ
- Gallery
- Hero Banner

### 3. Membership & Member Dashboard
- **Visitor:** Dapat melakukan pendaftaran (*Join Membership*) dengan mengisi data (Nama, Email, No. HP, Kota, Gender, Foto).
- **Admin:** Dapat memverifikasi (Approve/Reject/Suspend) pendaftar.
- **Member:** Setelah disetujui dan *login*, dapat mengakses *Dashboard* (Profile, Membership Card, Event History, Certificate).

### 4. Event Management & Registration
- **Pembuatan Event:** Admin dapat membuat acara dengan parameter (Nama, Banner, Lokasi, G-Maps, Waktu, Kuota, Harga, Periode Registrasi). Status: Draft, Published, Closed, Cancelled.
- **Registrasi Event:** Member dapat mendaftar. Jika gratis, otomatis disetujui. Jika berbayar, diarahkan ke *Payment Gateway* (Future Scope) atau verifikasi manual.

### 5. QR Check-in
Admin dapat memindai QR code (*Membership QR* atau *Event QR*) dari peserta menggunakan *Check-in Scanner* untuk mencatat kehadiran.

### 6. Gallery & News
- Admin dapat mengunggah foto/video YouTube.
- Admin dapat membuat dan mempublikasikan artikel berita/pengumuman.

### 7. Settings
Pengaturan kustomisasi microsite (Logo, Banner, Social Media, Address, Email, Phone, Color Theme).

## Non-Functional Requirements (NFR)
- **Performance:** Page Load < 2 detik, API Response < 500 ms.
- **Availability:** 99.9% uptime.
- **Responsive:** Desktop, Tablet, Mobile (Mobile-first design).
- **SEO:** Menggunakan *Server-Side Rendering* (SSR) untuk microsite.
- **Security:**
  - JWT untuk Autentikasi
  - HTTPS
  - Rate Limit
  - RBAC (Role-Based Access Control)
  - Audit Log

## Success Metrics (Target 6 Bulan Pertama)
- **Community:** 100 Komunitas terdaftar.
- **Member:** 5.000 Member aktif.
- **Event:** 500 Event terselenggara melalui sistem.
- **MRR (Monthly Recurring Revenue):** Rp20.000.000.
