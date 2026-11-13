# Roadmap Eksekusi — Sistem Absensi QR

> Untuk **agent eksekusi**. Kerjakan fase **berurutan**. Jangan lanjut ke fase berikutnya sebelum **Definition of Done (DoD)** fase ini terpenuhi. Spesifikasi lengkap ada di `PRD.md`; tampilan di `design-system.md`.

## Aturan Kerja Agent

1. Satu task = satu commit kecil dengan pesan jelas (`feat:`, `fix:`, `chore:`).
2. Setelah setiap fase jalankan `npm run lint && npm run build`. Perbaiki sebelum lanjut.
3. Jangan menambah fitur di luar PRD. Hal yang masuk *non-goals* dilarang.
4. Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di kode client atau variabel `NEXT_PUBLIC_*`.
5. Semua teks UI berbahasa Indonesia.
6. Jika ada ambiguitas, pakai default di PRD bagian 4 dan 18, lalu catat keputusan di `docs/decisions.md` (satu baris per keputusan).
7. Centang `[x]` task di file ini seiring selesai.

---

## Fase 0 — Setup Proyek

**Tujuan:** kerangka proyek berjalan dengan tema warna benar.

- [x] Buat proyek: `npx create-next-app@latest . --typescript --tailwind --eslint --app --import-alias "@/*"`
- [x] Inisialisasi shadcn: `npx shadcn@latest init`
- [x] Tambah komponen: `npx shadcn@latest add button card dialog form input label command popover badge sonner scroll-area progress table tabs select skeleton`
- [x] Install dependensi: `npm i @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers papaparse qrcode motion`
- [x] Install dev: `npm i -D @types/papaparse @types/qrcode vitest`
- [x] Terapkan token warna & font dari `design-system.md` ke `app/globals.css` dan `app/layout.tsx` (next/font: Poppins + Inter)
- [x] Buat `.env.local.example` sesuai PRD bagian 14
- [x] Buat struktur folder sesuai PRD bagian 13 (file kosong/placeholder boleh)

**DoD:** `npm run dev` jalan; halaman placeholder menampilkan warna hijau/kuning/hijau tua yang benar; build lulus.

---

## Fase 1 — Database & Klien Supabase

**Tujuan:** skema, RLS, dan tiga klien Supabase siap.

- [ ] Simpan SQL dari PRD bagian 9 ke `supabase/migrations/0001_init.sql`
- [ ] Jalankan migrasi di project Supabase (SQL Editor atau Supabase CLI)
- [ ] Isi `.env.local` dengan kredensial project
- [ ] `lib/supabase/client.ts` (browser, anon)
- [ ] `lib/supabase/server.ts` (server, `@supabase/ssr` + cookies)
- [ ] `lib/supabase/admin.ts` (service role, tambahkan `import 'server-only'`)
- [ ] `lib/normalize.ts` + `lib/schemas.ts` (zod: `attendanceSchema`, `guestRowSchema`)
- [ ] Unit test `normalize` dan skema
- [ ] Seed data uji: 20–30 tamu dummy dengan 5–6 daerah (`supabase/seed.sql`)

**DoD:**
- Query `select` dengan anon key berhasil membaca `sessions`, `guests`, `attendances`.
- Percobaan `insert` ke `attendances` memakai anon key **ditolak** oleh RLS (buktikan dengan satu skrip/test).
- Unit test lulus.

---

## Fase 2 — Alur Peserta `/absen`

**Tujuan:** peserta bisa absen end-to-end.

- [ ] `app/page.tsx`: redirect ke `/absen`
- [ ] `session-picker.tsx`: dua kartu besar (Hari Pertama / Hari Kedua) sesuai design system
- [ ] `attendance-dialog.tsx`: shadcn Dialog + react-hook-form + zod
- [ ] `name-combobox.tsx`: Command + Popover; sumber data `guests`; boleh ketik bebas (walk-in); pilih tamu → isi daerah otomatis
- [ ] Field Perwakilan Daerah dengan saran dari daftar daerah unik
- [ ] Honeypot field `website` (tersembunyi dari user, `tabIndex=-1`, `autoComplete="off"`)
- [ ] `lib/rate-limit.ts` (in-memory, 10/menit/IP)
- [ ] `app/absen/actions.ts`: `submitAttendance` sesuai PRD bagian 10
- [ ] State dialog: *form → pending → sukses* dan *already* (nada ramah, bukan error)
- [ ] Toast/pesan error inline berbahasa Indonesia
- [ ] Uji di viewport 360×640

**DoD:**
- Absen tamu terdaftar → baris baru di `attendances` dengan `guest_id` terisi.
- Absen nama baru → baris dengan `is_walk_in = true`.
- Absen kedua kali di sesi yang sama → state "sudah tercatat", tidak ada baris baru.
- Double-tap tidak membuat duplikat.
- Honeypot terisi → tidak ada data tersimpan.

---

## Fase 3 — Videotron `/display`

**Tujuan:** layar realtime siap tayang.

- [ ] `app/display/page.tsx`: baca `?sesi=`; fallback sesuai tanggal WIB lalu sesi 1; ambil data awal di server
- [ ] `attendance-board.tsx` (client): state `guests`, `attendances`; derivasi `hadir`, `belumHadir`, `total`
- [ ] Subscribe Realtime (INSERT, filter `session_id`); cleanup saat unmount
- [ ] Fallback refetch penuh tiap 30 dtk
- [ ] Indikator koneksi kecil ("Terhubung" / "Menyambung ulang…")
- [ ] Header: nama acara, sesi, jam WIB
- [ ] Counter + progress bar (`Hadir / Total`)
- [ ] Dua kolom: **Sudah Hadir** (terbaru di atas) dan **Belum Hadir** (urut daerah → nama)
- [ ] `guest-chip.tsx`: chip nama + daerah; varian hadir, belum hadir, walk-in
- [ ] Animasi masuk nama baru dan keluar dari "Belum Hadir" (`motion` layout animation)
- [ ] `welcome-banner.tsx`: sambutan 5 dtk dengan antrean
- [ ] Auto-scroll pelan untuk kolom yang overflow (berhenti jika muat)
- [ ] Tema gelap hijau tua penuh layar (lihat design system), optimasi 1920×1080
- [ ] Sembunyikan kursor setelah idle; tanpa scrollbar terlihat

**DoD:**
- Dengan `/display?sesi=1` terbuka, absen dari `/absen` membuat nama muncul ≤ 2 dtk tanpa refresh.
- Nama pindah dari "Belum Hadir" ke "Sudah Hadir"; counter benar.
- Matikan jaringan 20 dtk lalu nyalakan → layar pulih dan data konsisten.
- Daftar tamu 300 nama tidak membuat layar lag.

---

## Fase 4 — Admin

**Tujuan:** panitia bisa menyiapkan dan memantau acara.

- [ ] `middleware.ts`: proteksi `/admin/*` kecuali `/admin/login`
- [ ] `/admin/login`: form email/password (Supabase Auth)
- [ ] `/admin` tab **Tamu**: tabel tamu + tombol **Import CSV** (papaparse → pratinjau valid/duplikat/invalid → simpan batch)
- [ ] Sediakan tombol unduh template CSV (`nama,perwakilan_daerah`)
- [ ] `/admin` tab **Rekap**: tabel `attendances` per sesi, filter daerah, ekspor CSV (waktu WIB)
- [ ] `/admin/qr`: QR ke `${NEXT_PUBLIC_SITE_URL}/absen` + teks "Scan untuk absen" + gaya cetak (`@media print`)
- [ ] (P2, opsional) hapus entri absensi

**DoD:**
- Akses `/admin` tanpa login → diarahkan ke `/admin/login`.
- Import CSV 100 baris (campur valid, duplikat, invalid) → ringkasan hitungan benar, hanya baris valid yang masuk.
- File ekspor CSV terbuka benar di Excel (UTF-8 dengan BOM).
- QR hasil cetak dipindai dan membuka `/absen`.

---

## Fase 5 — Hardening & Deploy

**Tujuan:** aman dan siap produksi.

- [ ] Audit: tidak ada service role key di bundle client (`grep` pada `.next/static`)
- [ ] Verifikasi RLS ulang di project produksi
- [ ] Metadata, favicon, `viewport`, dan `robots: noindex` untuk `/display` dan `/admin`
- [ ] Error boundary & halaman `not-found` bergaya sesuai design system
- [ ] Cek kontras warna (WCAG AA) pada halaman utama
- [ ] Deploy ke Vercel; set semua env var; set `NEXT_PUBLIC_SITE_URL` ke domain final
- [ ] Buat akun admin di Supabase Auth
- [ ] Tulis `README.md` singkat: setup lokal, env, cara import tamu, cara membuka videotron

**DoD:** build produksi hijau; seluruh alur berjalan di domain produksi; README cukup bagi orang lain untuk menjalankan ulang.

---

## Fase 6 — UAT & Persiapan Hari-H

**Tujuan:** pastikan tidak ada kejutan di acara.

**Checklist UAT (centang semua):**

- [ ] Scan QR cetak dari 2 jenis HP (iOS & Android), buka `/absen` < 3 dtk
- [ ] Absen Hari 1 dan Hari 2 untuk orang yang sama → keduanya tercatat
- [ ] Absen ganda di sesi sama → pesan "sudah tercatat"
- [ ] Tamu dadakan → muncul di layar dengan penanda walk-in
- [ ] Layar `/display` di perangkat videotron sebenarnya: teks terbaca dari jarak jauh, tidak terpotong, tidak ada scrollbar
- [ ] Simulasi 30 submit berurutan cepat → semua tampil, tanpa duplikat atau hilang
- [ ] Jaringan venue putus-sambung → layar pulih sendiri
- [ ] Ekspor CSV hasil uji cocok dengan data di layar
- [ ] **Bersihkan data uji** (`truncate attendances`) dan import daftar tamu final sebelum acara

**Cadangan hari-H:**
- [ ] Siapkan cetakan QR cadangan dan tautan pendek `/absen`
- [ ] Simpan unduhan CSV rekap di akhir setiap sesi

**DoD:** semua checklist UAT tercentang; panitia tahu cara membuka `/display?sesi=1` dan `?sesi=2`.

---

## Ringkasan Urutan & Ketergantungan

```
Fase 0 → Fase 1 → Fase 2 ─┐
                          ├→ Fase 4 → Fase 5 → Fase 6
              Fase 1 → Fase 3 ─┘
```

Fase 2 dan 3 sama-sama bergantung pada Fase 1 dan boleh dikerjakan paralel, tetapi uji realtime Fase 3 membutuhkan alur submit dari Fase 2.
