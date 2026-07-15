# 04 ARCHITECTURE & 08 MULTI-TENANT

## Purpose
Mendokumentasikan arsitektur *Multi-tenant* dari platform SaaS CommunityOS.

## Tenant Architecture

Platform CommunityOS menggunakan pendekatan arsitektur *Single Database, Multi-Tenant*.
Artinya:
- Semua data tenant (komunitas) disimpan dalam satu *database* fisik (PostgreSQL).
- Pemisahan data dilakukan di tingkat aplikasi menggunakan `community_id` di setiap tabel.

### URL Routing & Resolution

Setiap komunitas memiliki *microsite* publik sendiri. Resolusi tenant dilakukan pada level *Frontend* (Next.js Middleware) dan disalurkan ke *Backend* (NestJS).

**1. Default Subdirectory Routing (`/slug`)**
Secara *default*, komunitas baru yang didaftarkan akan mendapatkan URL dengan format *slug* di bawah domain utama:
- `community.id/jakartarunners`
- `community.id/vespajakarta`
- `community.id/badmintonbsd`

**2. Custom Domain (Premium)**
Untuk komunitas dengan skema langganan Premium/Pro, sistem mendukung *Custom Domain*.
- `www.jakartarunners.com`
Next.js Middleware akan mendeteksi `hostname` dari *request* HTTP dan melakukan *rewrite* internal secara transparan agar terhubung ke data `jakartarunners`.

### Isolation Strategy
Untuk memastikan keamanan dan privasi antar tenant:
- Di sisi Backend (Prisma), setiap *query* (kecuali Super Admin) **wajib** menyertakan filter `where: { community_id: currentCommunityId }`. Hal ini dapat diotomatisasi melalui Prisma Middleware atau *Tenant Service Provider*.
- *Files/Assets* yang diunggah (Gambar, Logo, Dokumen) disimpan di *Object Storage* (S3) dengan hierarki *path* yang dipisahkan per `community_id`.
