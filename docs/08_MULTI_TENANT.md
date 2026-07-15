# 08 MULTI-TENANT

*Catatan: Dokumen ini terintegrasi dengan `04_ARCHITECTURE.md`.*

Platform ini dibangun dengan fondasi **Multi-Tenant** di mana satu sistem *codebase* melayani ratusan komunitas yang berbeda secara independen. Setiap tabel data utama (seperti `Membership`, `Event`, `Gallery`, `News`) wajib memiliki kolom referensi silang (Foreign Key) bernama `community_id`.

## Skema Identifikasi URL

**1. /slug (Starter/Free Plan)**
Default routing bagi komunitas. URL yang digunakan adalah kombinasi domain utama platform dan *slug* komunitas.
Contoh: `community.id/jakartarunners`

**2. Custom Domain (Pro/Enterprise Plan)**
Routing melalui CNAME DNS yang disetel pada domain milik komunitas yang mengarah ke *server* CommunityOS.
Contoh: `www.jakartarunners.com`

Sistem Next.js akan memotong (*intercept*) setiap *request* melalui `middleware.ts` untuk memverifikasi `hostname` dan menginjeksikan parameter *tenant* sebelum merender halaman (App Router).
