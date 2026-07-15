# 11 EVENTS

## Purpose
Mendokumentasikan siklus hidup pembuatan, pendaftaran, dan manajemen hari-H (Check-in) sebuah Event.

## Event Management
Community Admin dapat menjadwalkan dan mempublikasikan acara. Atribut data acara meliputi:
- **Nama Event & Banner** (Poster)
- **Lokasi & Link Google Maps**
- **Tanggal & Jam Pelaksanaan**
- **Kuota Peserta** (Limitasi otomatis saat pendaftaran penuh)
- **Harga Tiket** (Rp. 0 untuk acara gratis)
- **Periode Registrasi** (Open & Close Date)

**Status Event:**
1. `Draft` - Masih dalam penyusunan, tidak terlihat publik.
2. `Published` - Terlihat publik, pendaftaran dibuka/ditutup otomatis sesuai periode.
3. `Closed` - Acara telah selesai.
4. `Cancelled` - Acara dibatalkan.

## Event Registration
1. Hanya **Member** (berstatus Approved) yang bisa melakukan registrasi acara eksklusif, kecuali acara tersebut di-set untuk publik.
2. Saat Member menekan **Register**:
   - Jika **Gratis**, status langsung berhasil dan tiket/QR terbit.
   - Jika **Berbayar**, Member akan diarahkan ke siklus *Payment/Checkout* (Phase 2). Status pendaftaran adalah `Pending Payment`.

## QR Check-in
Inovasi inti untuk operasional acara komunitas adalah *Check-in Scanner* terintegrasi.
- **Admin/Panitia** membuka fitur "Check-in Scanner" di ponsel cerdas mereka.
- **Peserta** menunjukkan QR Code yang ada di *Membership Card* mereka, atau QR khusus dari tiket Event tersebut.
- Sistem akan memverifikasi QR Code secara riil. Jika valid, *database* `Registration` peserta tersebut otomatis berubah menjadi `check_in = true`.
- Data absensi ini dapat diunduh untuk keperluan laporan atau *Certificate Generator*.
