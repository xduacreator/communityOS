# 05 DATABASE

## Purpose
Mendokumentasikan struktur entitas *database* utama (Relational Database) dari CommunityOS. Desain ini menggunakan PostgreSQL (melalui Prisma ORM) dengan implementasi relasi Multi-Tenant.

## Skema Entitas Dasar (Simplified)

### `Community`
Entitas utama (Tenant) yang menaungi seluruh data pengguna dan aktivitasnya.
- `id` (PK, UUID)
- `name` (String)
- `slug` (String, Unique) - Digunakan untuk sub-path routing
- `logo` (String, Nullable)
- `theme` (JSON/String) - Konfigurasi UI
- `status` (Enum: Active, Suspended)
- `created_at` (DateTime)

### `User`
Akun logikal dari orang yang menggunakan platform. Bisa terdaftar di lebih dari satu komunitas.
- `id` (PK, UUID)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `status` (Enum: Active, Banned)

### `Membership` (CommunityMember)
Tabel pivot yang menghubungkan `User` dengan `Community` beserta perannya (RBAC).
- `id` (PK, UUID)
- `community_id` (FK -> Community)
- `user_id` (FK -> User)
- `role` (Enum: COMMUNITY_ADMIN, MEMBER)
- `member_no` (String, Unique per komunitas)
- `join_date` (DateTime)
- `expire_date` (DateTime, Nullable)
- `status` (Enum: Pending, Approved, Rejected, Suspended)

### `Event`
Manajemen acara yang dikelola oleh komunitas.
- `id` (PK, UUID)
- `community_id` (FK -> Community)
- `title` (String)
- `description` (Text)
- `quota` (Int)
- `price` (Decimal/Int) - 0 jika gratis
- `start_date` (DateTime)
- `end_date` (DateTime)
- `status` (Enum: Draft, Published, Closed, Cancelled)

### `Registration` (EventRegistration)
Data anggota yang mendaftar ke suatu acara.
- `id` (PK, UUID)
- `event_id` (FK -> Event)
- `user_id` (FK -> User)
- `payment_status` (Enum: Pending, Paid, Failed)
- `check_in` (Boolean) - Diubah saat *QR Check-in*
- `certificate` (String, Nullable) - URL sertifikat

### `Gallery`
Penyimpanan dokumentasi foto komunitas.
- `id` (PK)
- `community_id` (FK -> Community)
- `image` (String) - URL Objek S3
- `caption` (String)

### `News`
Artikel berita atau pengumuman dari admin komunitas.
- `id` (PK)
- `community_id` (FK -> Community)
- `title` (String)
- `content` (Text)
- `status` (Enum: Draft, Published)
