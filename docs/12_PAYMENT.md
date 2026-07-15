# 12 PAYMENT & MONETIZATION

## Purpose
Mendokumentasikan model monetisasi dan alur pembayaran untuk fitur Premium dan Registrasi Event. Fitur ini direncanakan untuk Phase 2.

## Model Monetisasi SaaS

CommunityOS menggunakan skema *Freemium SaaS*:
1. **Free:** Limitasi 50 Member, 2 Event. Fitur dasar.
2. **Starter:** Limitasi 500 Member, Unlimited Event.
3. **Pro:** Unlimited Member, Custom Domain, Analytics Advanced, Payment Integration, WhatsApp Notif.
4. **Enterprise:** White Label, Public API, Multi-Admin (Super Admin spesifik per cabang).

Pendapatan CommunityOS (Super Admin) bersumber dari:
- Biaya langganan bulanan/tahunan (Subscription SaaS).
- *Payment Fee* (Potongan admin per transaksi event berbayar yang lewat sistem).
- *Add-on* fitur spesifik.

## Payment Gateway Integration (Phase 2)
1. Komunitas (Tenant) menghubungkan akun bank mereka melalui *Payment Gateway Middleware* (seperti Xendit/Midtrans).
2. Peserta mendaftar *event* berbayar, sistem menghasilkan Virtual Account / QRIS.
3. Setelah dibayar, dana masuk ke rekening escrow/platform, lalu didistribusikan ke rekening komunitas setelah dipotong *Payment Fee*.
4. Status `Registration` berubah dari `Pending Payment` menjadi `Paid`.
