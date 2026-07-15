# 07 RBAC (Role-Based Access Control)

## Purpose
Mendefinisikan hak akses setiap peran pengguna (*User Role*) dalam platform CommunityOS.

## Sistem Otorisasi
Otorisasi (*Authorization*) pada platform ini bersifat hibrida:
1. **Global Authorization:** Memeriksa apakah *user* adalah Super Admin.
2. **Tenant-based Authorization:** Memeriksa peran *user* pada *community_id* tertentu (direlasikan pada tabel `Membership`). Seseorang bisa menjadi Community Admin di Komunitas A, namun hanya menjadi Member biasa di Komunitas B.

## Matrix Hak Akses

| Fitur / Modul | Super Admin | Community Admin | Member | Visitor |
| :--- | :---: | :---: | :---: | :---: |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |
| **Create/Suspend Community** | ✅ | ❌ | ❌ | ❌ |
| **Manage Subscription** | ✅ | ❌ | ❌ | ❌ |
| **Microsite (Read)** | ✅ | ✅ | ✅ | ✅ |
| **CMS Management** | ✅ | ✅ | ❌ | ❌ |
| **Membership Approval** | ✅ | ✅ | ❌ | ❌ |
| **Event Management** | ✅ | ✅ | ❌ | ❌ |
| **Gallery/News (Create)** | ✅ | ✅ | ❌ | ❌ |
| **Register Event** | ❌ | ❌ | ✅ | ❌ (Harus Join) |
| **Download Certificate** | ❌ | ❌ | ✅ | ❌ |
| **Membership Card** | ❌ | ❌ | ✅ | ❌ |

## Implementasi Backend (NestJS)
Sistem menggunakan *Guards* dan *Decorators* khusus di NestJS:
- `@RequireRole('SUPER_ADMIN')` untuk *endpoint* global.
- `@RequireTenantRole('COMMUNITY_ADMIN')` yang akan memverifikasi *JWT payload* dengan `community_id` yang sedang diakses.
