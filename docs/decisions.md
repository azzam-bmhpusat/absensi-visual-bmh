# Log Keputusan Arsitektur

- Fase 0: Setup proyek menggunakan Next.js App Router (TypeScript, Tailwind CSS v4, ESLint) dan shadcn/ui dengan token tema BMH (hijau-emas).
- Fase 1: Desain skema database Supabase dengan RLS ketat, normalisasi string case-insensitive, dan pemisahan service role untuk Server Action.
- Fase 2: Alur peserta mobile-first di `/absen` dengan anti-duplikat, dialog ramah, honeypot spam protection, dan in-memory rate limiting.
- Fase 3: Layar videotron `/display` realtime dengan Supabase subscriptions, fallback polling 30 dtk, auto-scroll dinamis, dan welcome banner.
- Fase 4: Panel admin `/admin` terproteksi Supabase Auth dengan fitur import CSV (pratinjau duplikat/invalid), rekap kehadiran dengan ekspor CSV UTF-8 BOM, dan modul cetak QR.
- Fase 5: Hardening keamanan (verifikasi RLS, eliminasi token rahasia dari bundle client), metadata noindex untuk admin & videotron, dan error boundary.
- Fase 6: Otomasi UAT multi-skenario (skenario multi-hari, anti-duplikat, walk-in, stress test 30 submit, ekspor CSV), skrip pembersih data absensi uji coba sebelum acara, dan penyusunan panduan operasional Hari-H panitia.
