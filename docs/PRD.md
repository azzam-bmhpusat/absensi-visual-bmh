# PRD — Sistem Absensi QR Acara (2 Hari)

> Dokumen ini ditulis untuk **agent eksekusi**. Ikuti spesifikasi apa adanya. Jika ada hal yang ambigu, pakai **default** yang tertulis di bagian *Asumsi & Keputusan*, jangan berhenti untuk bertanya.
> Dokumen pendamping: `roadmap.md` (urutan kerja) dan `design-system.md` (tampilan).

---

## 1. Ringkasan

Sistem absensi berbasis QR untuk acara perkumpulan yang berlangsung **dua hari**. Peserta memindai satu QR, memilih sesi (Hari Pertama / Hari Kedua), mengisi Nama dan Perwakilan Daerah, lalu kehadirannya langsung tampil di layar presentasi / videotron. Layar menampilkan dua daftar: **Sudah Hadir** dan **Belum Hadir**, diperbarui secara realtime.

**Tech stack (wajib):** Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Supabase (Postgres + Realtime + Auth untuk admin).

## 2. Tujuan & Metrik Keberhasilan

| Tujuan | Metrik |
|---|---|
| Absen cepat tanpa login | Peserta selesai absen ≤ 30 detik dari scan QR |
| Layar selalu mutakhir | Nama muncul di videotron ≤ 2 detik setelah submit |
| Data akurat | Tidak ada absen ganda per orang per sesi |
| Stabil di hari-H | Mampu ≥ 300 peserta, ≥ 50 submit/menit tanpa error |

## 3. Pengguna

- **Peserta**: scan QR dengan HP, tanpa akun.
- **Panitia/Admin**: import daftar tamu, cetak QR, pantau rekap, ekspor data. Login via Supabase Auth.
- **Audiens layar**: melihat videotron (tanpa interaksi).

## 4. Asumsi & Keputusan (default)

1. **Daftar tamu undangan di-import admin** (CSV: `nama,perwakilan_daerah`) sebelum acara. Ini wajib agar kolom "Belum Hadir" bisa dihitung.
2. **Tamu dadakan (walk-in) diizinkan**: peserta yang namanya tidak ada di daftar boleh mengetik nama sendiri; ia tetap tercatat dan tampil di "Sudah Hadir" dengan penanda *walk-in*.
3. **Satu QR statis** untuk kedua hari, mengarah ke `/absen`. Sesi dipilih manual oleh peserta.
4. **Satu orang = satu absen per sesi.** Orang yang sama boleh absen di Hari 1 dan Hari 2.
5. **Tanpa verifikasi lokasi/foto** (di luar scope MVP).
6. Bahasa antarmuka: **Bahasa Indonesia**.
7. Zona waktu tampilan: **Asia/Jakarta (WIB)**.

## 5. Scope

### In scope (MVP)
- Halaman absen peserta (`/absen`) dengan pilihan sesi + dialog form.
- Halaman videotron (`/display`) realtime.
- Halaman admin (`/admin`): login, import tamu CSV, rekap, ekspor CSV, generator/cetak QR.
- Pencegahan duplikat, validasi, rate limiting dasar.

### Non-goals (jangan dikerjakan)
- Check-out, scan QR per-orang, e-ticket, notifikasi WhatsApp/email.
- Multi-event, multi-tenant, role admin berlapis.
- Face recognition / geofencing.

## 6. User Flow

### 6.1 Peserta
1. Scan QR → buka `/absen`.
2. Layar menampilkan dua kartu besar: **Hari Pertama** dan **Hari Kedua**.
3. Tap salah satu → muncul **Dialog** (shadcn) berisi form:
   - **Nama** (combobox: cari dari daftar tamu; boleh ketik bebas).
   - **Perwakilan Daerah** (terisi otomatis jika nama dipilih dari daftar; jika tidak, combobox/teks bebas dengan saran dari daerah yang ada).
   - Tombol **Hadir**.
4. Submit → dialog berubah jadi **state sukses** ("Terima kasih, {nama}. Kehadiran Anda tercatat di {sesi}.") dan tombol tutup.
5. Jika sudah pernah absen di sesi itu → state **"Anda sudah tercatat hadir"** (bukan error merah).

### 6.2 Videotron
1. Buka `/display?sesi=1` (atau `2`) di browser layar penuh. Tanpa parameter: pilih sesi yang `tanggal`-nya = hari ini (WIB), fallback sesi 1.
2. Menampilkan header, counter, dan dua kolom: **Sudah Hadir** (terbaru di atas) dan **Belum Hadir**.
3. Saat ada absen baru: nama muncul di kolom hadir dengan animasi, hilang dari kolom belum hadir, counter bertambah, dan banner sambutan tampil 5 detik.

### 6.3 Admin
1. Login `/admin/login` (email + password Supabase Auth).
2. Import CSV tamu → pratinjau → konfirmasi.
3. Lihat rekap per sesi, ekspor CSV, buka halaman cetak QR.

## 7. Functional Requirements

Prioritas: **P0** wajib MVP, **P1** sebaiknya ada, **P2** opsional.

| ID | Prioritas | Requirement | Acceptance Criteria |
|---|---|---|---|
| FR-01 | P0 | Pilihan sesi di `/absen` | Dua kartu tampil tanpa loading panjang; tap membuka dialog dengan sesi terpilih ditampilkan di judul dialog |
| FR-02 | P0 | Form dialog | Field Nama & Perwakilan Daerah wajib, trim spasi, 2–100 karakter; error inline berbahasa Indonesia |
| FR-03 | P0 | Combobox Nama dari `guests` | Mengetik memfilter daftar (case-insensitive, abaikan aksen); memilih tamu mengisi daerah otomatis |
| FR-04 | P0 | Walk-in | Nama yang tidak ada di daftar tetap bisa dikirim; tersimpan dengan `is_walk_in = true` |
| FR-05 | P0 | Simpan absen via Server Action | Insert memakai service role di server; response `ok` / `already` / `error` |
| FR-06 | P0 | Anti-duplikat | Unique index DB mencegah duplikat; UI menampilkan state "sudah tercatat" |
| FR-07 | P0 | `/display` realtime | Subscribe INSERT pada `attendances` terfilter `session_id`; update UI ≤ 2 dtk |
| FR-08 | P0 | Daftar Belum Hadir | = `guests` yang tidak punya `attendances` pada sesi aktif (match via `guest_id`) |
| FR-09 | P0 | Counter | Menampilkan `Hadir / Total tamu` + progress bar; walk-in dihitung di Hadir, tidak menambah Total |
| FR-10 | P0 | Ketahanan display | Jika koneksi realtime putus: indikator kecil "Menyambung ulang…", auto-reconnect, dan refetch penuh tiap 30 dtk sebagai fallback |
| FR-11 | P1 | Banner sambutan | Setiap absen baru memunculkan "Selamat datang, {nama} — {daerah}" selama 5 dtk; antrean jika banyak sekaligus |
| FR-12 | P1 | Auto-scroll | Kolom yang overflow di-scroll otomatis pelan dan berulang; berhenti jika daftar muat layar |
| FR-13 | P1 | Admin login | Hanya user Supabase Auth terautentikasi yang bisa akses `/admin/*` (middleware) |
| FR-14 | P1 | Import CSV tamu | Header `nama,perwakilan_daerah`; pratinjau jumlah baris valid/duplikat/invalid sebelum simpan; duplikat dilewati |
| FR-15 | P1 | Rekap & ekspor | Tabel absensi per sesi + tombol Ekspor CSV (nama, daerah, sesi, waktu WIB, walk-in) |
| FR-16 | P1 | Generator QR | Halaman cetak berisi QR ke `${NEXT_PUBLIC_SITE_URL}/absen` + teks "Scan untuk absen" |
| FR-17 | P1 | Rate limit | Maks 10 submit/menit per IP (in-memory cukup) + honeypot field tersembunyi |
| FR-18 | P2 | Hapus/ubah absen oleh admin | Admin bisa menghapus entri salah |
| FR-19 | P2 | Tautkan walk-in ke tamu | Admin bisa menautkan entri walk-in ke tamu di daftar |

## 8. Non-Functional Requirements

- **Mobile-first** untuk `/absen` (lebar 360 px), target tap ≥ 44 px.
- **Videotron** dioptimalkan untuk 1920×1080 landscape, tanpa scrollbar terlihat, tanpa elemen interaktif.
- **Performa**: LCP `/absen` < 2,5 dtk di 4G. Tidak memuat library berat di `/absen`.
- **Keamanan**: tidak ada `service_role` key di client bundle; semua tulis publik lewat Server Action; RLS aktif di semua tabel.
- **Aksesibilitas**: kontras sesuai `design-system.md`; dialog bisa dioperasikan keyboard; label form terhubung ke input.
- **Privasi**: data hanya nama dan daerah. Catat bahwa daftar tamu terbaca publik via anon key (diterima karena memang ditampilkan di layar).

## 9. Model Data (Supabase / Postgres)

Simpan sebagai `supabase/migrations/0001_init.sql`.

```sql
create extension if not exists "pgcrypto";

-- Sesi acara (2 baris tetap)
create table public.sessions (
  id        smallint primary key,
  slug      text unique not null,
  nama      text not null,
  tanggal   date,
  is_active boolean not null default true
);

insert into public.sessions (id, slug, nama) values
  (1, 'hari-1', 'Hari Pertama'),
  (2, 'hari-2', 'Hari Kedua');

-- Daftar tamu undangan
create table public.guests (
  id                uuid primary key default gen_random_uuid(),
  nama              text not null,
  perwakilan_daerah text not null,
  created_at        timestamptz not null default now()
);
create unique index guests_unique_person
  on public.guests (lower(trim(nama)), lower(trim(perwakilan_daerah)));

-- Catatan kehadiran
create table public.attendances (
  id                uuid primary key default gen_random_uuid(),
  session_id        smallint not null references public.sessions(id),
  guest_id          uuid references public.guests(id) on delete set null,
  nama              text not null,
  perwakilan_daerah text not null,
  is_walk_in        boolean not null default false,
  checked_in_at     timestamptz not null default now()
);
create unique index attendances_unique_person
  on public.attendances (session_id, lower(trim(nama)), lower(trim(perwakilan_daerah)));
create unique index attendances_unique_guest
  on public.attendances (session_id, guest_id) where guest_id is not null;
create index attendances_session_time
  on public.attendances (session_id, checked_in_at desc);

-- Realtime
alter publication supabase_realtime add table public.attendances;

-- RLS
alter table public.sessions    enable row level security;
alter table public.guests      enable row level security;
alter table public.attendances enable row level security;

create policy "read sessions"    on public.sessions    for select to anon, authenticated using (true);
create policy "read guests"      on public.guests      for select to anon, authenticated using (true);
create policy "read attendances" on public.attendances for select to anon, authenticated using (true);

-- Tulis hanya untuk admin (authenticated). Peserta menulis lewat Server Action (service role).
create policy "admin write guests"      on public.guests      for all to authenticated using (true) with check (true);
create policy "admin write attendances" on public.attendances for all to authenticated using (true) with check (true);
create policy "admin write sessions"    on public.sessions    for all to authenticated using (true) with check (true);
```

### Aturan normalisasi (`lib/normalize.ts`)
- `trim()`, kompres spasi ganda jadi satu.
- Perbandingan selalu `lower()`; simpan teks dengan kapitalisasi seperti diinput (title-case opsional untuk tampilan).

## 10. Logika Server Action `submitAttendance`

Input: `{ sessionId: 1|2, guestId?: string, nama: string, perwakilanDaerah: string, website?: string }` (`website` = honeypot).

1. Jika `website` terisi → kembalikan `{status:'ok'}` palsu tanpa menyimpan.
2. Validasi dengan **zod**; gagal → `{status:'error', fieldErrors}`.
3. Rate limit per IP (header `x-forwarded-for`); lewat batas → `{status:'error', message:'Terlalu banyak percobaan, coba sebentar lagi.'}`.
4. Tentukan tamu: jika `guestId` ada, ambil dari `guests` (pakai nama & daerah dari DB). Jika tidak, cari kecocokan persis `lower(trim(nama))` + `lower(trim(daerah))`; jika ketemu → anggap tamu terdaftar. Jika tidak → `is_walk_in = true`.
5. `insert ... on conflict do nothing returning id` dengan klien service role. Jika tidak ada baris dikembalikan → `{status:'already'}`.
6. Sukses → `{status:'ok', nama, sesi}`.

## 11. Spesifikasi `/display`

- Server Component memuat data awal (`sessions`, `guests`, `attendances` sesi aktif) lalu Client Component `AttendanceBoard` mengelola state.
- **Realtime**: `supabase.channel('attendances:'+sessionId).on('postgres_changes', {event:'INSERT', schema:'public', table:'attendances', filter:'session_id=eq.'+sessionId}, handler).subscribe()`.
- **Derivasi**:
  - `hadir` = semua `attendances` sesi itu, urut `checked_in_at desc`.
  - `belumHadir` = `guests` dengan `id` tidak ada di `hadir.guest_id`, urut `perwakilan_daerah`, lalu `nama`.
  - `total` = jumlah `guests`.
- **Layout** (detail di `design-system.md`): header → counter → dua kolom 50/50 → footer kecil status koneksi.
- Kolom "Belum Hadir" boleh dikelompokkan per Perwakilan Daerah bila daftar > 40 nama.
- Dilarang memakai `localStorage` untuk state penting; selalu bersumber dari DB.

## 12. Spesifikasi Admin

- `/admin/login`: form email/password (Supabase Auth). Akun admin dibuat manual lewat dashboard Supabase.
- `middleware.ts` melindungi `/admin/*` (kecuali `/admin/login`).
- `/admin`: tab **Rekap** (tabel per sesi + filter daerah + ekspor CSV), tab **Tamu** (daftar + import CSV), tab **QR** (preview + tombol cetak).
- Import CSV memakai `papaparse`; validasi per baris dengan zod yang sama.

## 13. Struktur Proyek

```
app/
  page.tsx                    # Landing page Beranda Rakernas BMH (S0–S8)
  absen/page.tsx
  absen/actions.ts            # submitAttendance
  display/page.tsx
  admin/login/page.tsx
  admin/page.tsx
  admin/qr/page.tsx
components/
  ui/                         # shadcn
  absen/session-picker.tsx
  absen/attendance-dialog.tsx
  absen/name-combobox.tsx
  display/attendance-board.tsx
  display/welcome-banner.tsx
  display/guest-chip.tsx
lib/
  supabase/client.ts          # browser (anon)
  supabase/server.ts          # server (cookies, anon)
  supabase/admin.ts           # service role, server-only
  schemas.ts                  # zod
  normalize.ts
  rate-limit.ts
middleware.ts
supabase/migrations/0001_init.sql
```

## 14. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only, jangan diawali NEXT_PUBLIC_
NEXT_PUBLIC_SITE_URL=             # dipakai untuk QR
NEXT_PUBLIC_EVENT_NAME=           # judul di header videotron
```

## 15. Edge Cases yang Harus Ditangani

- Dua orang bernama sama dari daerah berbeda → dianggap orang berbeda (unique key memakai nama + daerah).
- Peserta salah ketik daerah untuk nama yang ada di daftar → jika dipilih dari combobox, daerah dari DB dipakai (bukan input user).
- Double-tap tombol Hadir → tombol disabled saat pending; DB constraint sebagai pengaman terakhir.
- Peserta membuka QR sebelum/sesudah acara → tetap bisa absen (tanpa pembatasan waktu di MVP).
- Realtime putus saat acara → fallback refetch 30 dtk; layar tidak boleh kosong/blank.
- Daftar tamu kosong → `/display` tetap berfungsi: kolom "Belum Hadir" menampilkan "Daftar tamu belum diimpor".
- Nama panjang → truncate 2 baris dengan `title` penuh; jangan merusak grid.

## 16. Rencana Pengujian

- **Unit**: `normalize`, skema zod, derivasi `belumHadir`.
- **Integrasi**: Server Action untuk kasus `ok`, `already`, walk-in, honeypot, rate limit.
- **Manual UAT** (checklist di `roadmap.md` Fase 6): dua browser, satu `/absen` (mobile viewport) dan satu `/display`; verifikasi realtime, duplikat, dan reconnect (matikan/nyalakan jaringan).

## 17. Definition of Done (Keseluruhan)

- Semua FR **P0** dan **P1** lolos acceptance criteria.
- `npm run lint`, `npm run build`, dan unit test hijau.
- RLS terverifikasi: klien anon **tidak bisa** insert/update/delete langsung ke tabel mana pun.
- Dideploy ke Vercel dengan env var lengkap; QR hasil cetak berhasil dipindai dan membuka `/absen`.

## 18. Pertanyaan Terbuka (gunakan default jika tidak dijawab)

| Pertanyaan | Default |
|---|---|
| Nama resmi acara & logo untuk header | Pakai `NEXT_PUBLIC_EVENT_NAME`; logo placeholder teks |
| Tanggal Hari 1 & Hari 2 | Kosong; `/display` default ke sesi 1 |
| Perlu batas waktu absen per sesi? | Tidak |
