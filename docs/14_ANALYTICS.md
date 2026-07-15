# 14 ANALYTICS

## Purpose
Mendokumentasikan metrik pelaporan (Reporting & Analytics) yang akan disediakan dalam *Dashboard* untuk Super Admin dan Community Admin.

## Analytics Dashboard

### Super Admin Dashboard (Global Analytics)
*View* yang merekap seluruh aktivitas platform:
- **Total Communities:** Jumlah penyewa/tenants aktif.
- **Total Users/Members:** Akumulasi seluruh anggota komunitas.
- **MRR (Monthly Recurring Revenue):** Proyeksi pendapatan berlangganan bulan ini.
- **Total Events Hosted:** Pertumbuhan acara yang dibuat.
- **Traffic Overview:** Metrik agregat kunjungan ke seluruh *microsite*.

### Community Admin Dashboard (Tenant Analytics)
*View* spesifik yang hanya memperlihatkan data milik komunitasnya sendiri:
- **Total Members:** Anggota aktif, *pending approval*, dan *suspended*.
- **Demografi:** Sebaran kota, *gender*, dan umur anggota (sebagai data fundamental komunitas yang penting bagi sponsor).
- **Event Metrics:** Rata-rata peserta, tingkat kehadiran (*Check-in Rate* vs *Registration*).
- **Visitor Analytics:** Trafik kunjungan halaman *microsite* harian/bulanan.

### Reporting & Export
Diperlukan modul *Export* (CSV/Excel) untuk menarik data:
- Daftar *Members* lengkap dengan *custom fields*.
- Rekap absensi dan pendaftaran suatu *Event* (untuk disetorkan ke pihak sponsor atau LPJ).
