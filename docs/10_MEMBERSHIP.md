# 10 MEMBERSHIP

## Purpose
Mendokumentasikan alur penerimaan dan pengelolaan anggota (Member) di dalam komunitas.

## Alur Pendaftaran (Join Membership)
1. **Visitor** mengunjungi *microsite* komunitas.
2. Visitor menekan tombol **Join Membership**.
3. Sistem akan meminta Visitor untuk mengisi form yang disesuaikan:
   - Nama Lengkap
   - Email
   - Nomor Handphone / WhatsApp
   - Kota Asal
   - Jenis Kelamin (Gender)
   - Foto Profil
4. Setelah disubmit, status `Membership` akan tercatat sebagai **Pending** di *database*.
5. **Community Admin** menerima notifikasi (melalui *Dashboard*) bahwa ada pendaftar baru.
6. Admin melakukan *review* dan dapat memilih:
   - **Approve:** Mengaktifkan status member, meng-generate `member_no` unik.
   - **Reject:** Menolak pendaftaran dengan memberikan alasan (opsional).
   - **Suspend:** Menonaktifkan keanggotaan sewaktu-waktu jika melanggar aturan komunitas.

## Member Dashboard
Anggota yang telah berstatus **Approved** dapat *login* untuk mengakses Portal Anggota eksklusif.

### Fitur Dashboard
- **Profile:** Pembaruan data pribadi.
- **Membership Card:** Kartu identitas keanggotaan digital (dilengkapi QR Code untuk absensi).
- **My Events:** Daftar acara yang telah diikuti beserta status registrasi.
- **Certificate:** Halaman untuk mengunduh E-Sertifikat partisipasi *event*.
