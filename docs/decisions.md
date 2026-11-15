# Log Keputusan Arsitektur

- Fase 0: Setup proyek menggunakan Next.js App Router (TypeScript, Tailwind CSS v4, ESLint) dan shadcn/ui dengan token tema BMH (hijau-emas).
- Fase 1: Desain skema database Supabase dengan RLS ketat, normalisasi string case-insensitive, dan pemisahan service role untuk Server Action.
- Fase 2: Alur peserta mobile-first di `/absen` dengan anti-duplikat, dialog ramah, honeypot spam protection, dan in-memory rate limiting.
- Fase 3: Layar videotron `/display` realtime dengan Supabase subscriptions, fallback polling 30 dtk, auto-scroll dinamis, dan welcome banner.
- Fase 4: Panel admin `/admin` terproteksi Supabase Auth dengan fitur import CSV (pratinjau duplikat/invalid), rekap kehadiran dengan ekspor CSV UTF-8 BOM, dan modul cetak QR.
- Fase 5: Hardening keamanan (verifikasi RLS, eliminasi token rahasia dari bundle client), metadata noindex untuk admin & videotron, dan error boundary.
- Fase 6: Otomasi UAT multi-skenario (skenario multi-hari, anti-duplikat, walk-in, stress test 30 submit, ekspor CSV), skrip pembersih data absensi uji coba sebelum acara, dan penyusunan panduan operasional Hari-H panitia.

---

## Landing Page Rakernas BMH (`/`)

### Fase 0 — Persiapan & Pengambilan Aset (Selesai dengan Pengecualian)
- **Status Fase 0**: Selesai dengan pengecualian (aset gambar memakai placeholder terstandar dan rundown Hari 2 & 3 menggunakan teks fallback sementara akibat proteksi anti-bot pada situs sumber).
- **Proteksi Situs Sumber**: Situs sumber `https://rakernas2027hidayatullah.com/` menggunakan proteksi verifikasi peramban anti-bot (*"One moment, please..."*). Sesuai aturan keselamatan agent, verifikasi tidak dicoba untuk di-bypass otomatis.
- **Rundown Hari 2 & 3**: Menggunakan teks fallback *"Rundown akan segera diumumkan"* di `content/rakernas.ts` hingga data resmi diisi.
- **Aset Gambar**: 14 berkas gambar di `public/rakernas/` disiapkan sebagai placeholder valid (PNG/WebP/JPG) dengan teks pengingat *"PLACEHOLDER — GANTI DENGAN GAMBAR ASLI"* dan rasio aspek sesuai PRD.
- **Logo Acara (`public/logo.png`)**: Ukuran asli 511 × 489 px, format RGBA dengan transparansi. Mengingat logo memiliki teks dan elemen berwarna hijau tua, pada section Hero berlatar gelap (`display-theme` `#0A3A30`) logo dibungkus kontainer terang (`rounded-2xl bg-white p-4 md:p-6`) untuk menjamin kontras dan keterbacaan.
- **Tombol Login**: Ditiadakan dari landing page `/` (halaman informasi tunggal non-login).
- **Penghitung Pengunjung**: Ditiadakan (tidak menyalin widget pihak ketiga yang statis/tidak akurat).
- **Hak Cipta Aset**: Asumsi sementara bahwa aset diizinkan oleh panitia (belum dikonfirmasi resmi).

### Fase 1 — Konten Bertipe (Selesai)
- **Modul Konten Tunggal**: `content/rakernas.ts` dibuat sebagai *single source of truth* bertipe TypeScript ketat untuk seluruh teks, tanggal, jam, nominal tarif transportasi, nomor rekening, tautan eksternal, dan metadata.
- **Pematuhan Aturan Penggantian Nama (A.3)**:
  - `<title>` metadata: `"Rakernas BMH"`.
  - Judul acara H1: `"Rapat Kerja Nasional BMH 2027"`.
  - Alt logo: `"Logo Rakernas BMH 2027"`.
  - Tagline tema tetap: `"Konsolidasi Jati Diri dan Transformasi Organisasi Menuju Hidayatullah Mandiri dan Berpengaruh"`.
  - Pemilik rekening tetap: `"an. DPW Hidayatullah Jateng"`.
  - Tautan panitia tetap: `https://hidayatullahjateng.or.id/`.
- **Rundown Fallback**: Hari 2 dan Hari 3 diisi teks penampung `[{ time: "-", title: "Rundown akan segera diumumkan" }]`.
- **Validasi Otomatis**: Unit test `tests/rakernas-content.test.ts` (14 uji kasus) memverifikasi kelengkapan seluruh item konten (10 baris Hari 1, 5 dress code, 8 galeri lokasi, 6 titik asal × 3 tarif, 4 langkah pendaftaran, 5 item menu navigasi), kevalidan tautan `https://`, dan integritas aturan penggantian nama. Seluruh tes lolos.

### Fase 2 — Kerangka, Header, Hero (Selesai)
- **Struktur Halaman S0–S8**: Mengganti redirect `/absen` pada `app/page.tsx` dengan kerangka landing page lengkap S0–S8 berurutan, ritme latar sesuai PRD Bagian B.5, serta anchor ID (`#rundown`, `#dresscode`, `#lokasi`, `#transportasi`, `#pendaftaran`) dilengkapi kelas `scroll-mt-20` agar tidak tertutup sticky header saat digulir.
- **Sticky Site Header (S0)**: Komponen client `site-header.tsx` setinggi 64 px (`h-16`) dengan latar `bg-background/90 backdrop-blur border-b border-line`. Menampilkan logo `public/logo.png` (link ke `/`) dan shadcn `DropdownMenu` navigasi dengan target sentuh minimal 44 px (`size-11`). Tombol login ditiadakan.
- **Hero Section (S1)**: Komponen responsif mobile-first di `hero.tsx`. Bertumpuk di tengah pada 360 px (wadah logo putih kontras di atas teks), lalu bertransformasi menjadi dua kolom di breakpoint `lg` (teks di kiri, logo di kanan). Menampilkan Judul H1 `Rapat Kerja Nasional BMH 2027`, kutipan tema H2, tanggal besar `01 - 03` `Desember 2026`, serta tombol tautan Google Map `Hotel Grasia Semarang` beraksen emas dengan `target="_blank" rel="noopener noreferrer"`.
- **Integrasi Komponen Shadcn & Base UI**: Menggunakan pattern `render` prop pada Base UI primitive (`DropdownMenuTrigger` dan `Button`) untuk interoperabilitas tautan dan semantic button tanpa atribut `asChild`.
- **Integritas Design System**: `app/globals.css` bersih 100% tanpa perubahan (`git diff --exit-code` lolos).
- **Pengujian & Build**: Unit test `tests/rakernas-fase2.test.ts` (14 uji kasus) memverifikasi metadata, struktur S0–S8, header tanpa login, hero, dan audit kepatuhan token warna. Seluruh 100 tes unit Vitest lolos dan `npm run build` sukses mengompilasi route `/` sebagai Static Page.

### Fase 3 — Hitung Mundur & Rundown (Selesai)
- **Hitung Mundur Acara (S2)**: Komponen client `countdown.tsx` menghitung mundur secara presisi ke target `2026-12-01T10:00:00+07:00` menggunakan interval 1 detik dengan pembersihan unmount. Angka ditampilkan dalam 4 kartu grid (`Hari`, `Jam`, `Menit`, `Detik`) berwarna `text-brand-gold-soft` dengan `tabular-nums`.
- **Pencegahan Hydration Mismatch & Prerender Error**: Menggunakan React 19 `useSyncExternalStore` untuk membaca `Date.now()` hanya di client. Pada fase SSR / static prerender, server snapshot mengembalikan `null` sehingga merender `Skeleton` seukuran angka (`bg-white/10 animate-pulse`), meniadakan warning hidrasi dan error prerender Next.js 16 (`blocking-prerender-current-time-client`).
- **Rundown Acara (S3)**: Komponen client `rundown-tabs.tsx` menggunakan shadcn `Tabs` dengan layout grid 3 kolom (`w-full grid-cols-3 h-12`). Tab default ditentukan secara otomatis berbasis zona waktu WIB (Asia/Jakarta, UTC+7) via `getDefaultDay()`: tanggal 1 Des 2026 → `hari1`, 2 Des 2026 → `hari2`, 3 Des 2026 → `hari3`, dan sebelum/sesudah acara → `hari1`.
- **Gaya Timeline Vertikal & Subtitle Separator**: Tiap butir acara menggunakan `Badge variant="secondary"` (lebar `w-16`, `bg-green-100 text-primary`, `tabular-nums`) dan penanda alur timeline vertikal (`border-l border-line`). Fungsi `parseRundownTitle` memisahkan judul utama dan teks dalam kurung menjadi baris kedua `text-sm text-ink-muted`.
- **Penanganan Fallback Hari 2 & 3**: Menampilkan kartu penampung bertanda seru ramah dengan pesan *"Rundown akan segera diumumkan"* tanpa error render.
- **Helper Modular & Unit Testing**: `lib/rakernas-helpers.ts` memuat fungsi pure `getTimeLeft`, `getDefaultDay`, dan `parseRundownTitle`. Unit test `tests/rakernas-fase3.test.ts` (29 uji kasus) menguji selisih waktu matematis, penanganan waktu kedaluwarsa (`isExpired: true`), zona waktu WIB, parsing judul, struktur komponen, dan audit token warna. Total 129 uji unit Vitest lulus 100%, `app/globals.css` bersih tanpa modifikasi, dan `npm run build` berhasil menghasilkan halaman statis untuk rute `/`.

### Fase 4 — Dress Code & Lokasi (Selesai)
- **Dress Code Carousel (S4)**: Komponen client `dresscode-carousel.tsx` menampilkan 5 item panduan busana secara horizontal menggunakan Embla Carousel (`align: "start"`). Slide berukuran responsif mobile first (`basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4`) sehingga memberikan efek peek yang intuitif pada layar 360 px.
- **Rasio Aspek & Proteksi Pemotongan Gambar**: Menggunakan rasio `aspect-[3/4]` dengan `object-contain` dan latar `bg-muted/30` agar keseluruhan desain busana peserta tampak utuh tanpa terpotong (*no clipping*).
- **Kontrol Navigasi & Aksesibilitas**: Tombol prev/next disembunyikan di mobile dan ditampilkan mulai breakpoint `md` (`hidden md:inline-flex`). Indikator titik pagination di bawah disinkronisasi melalui event Embla `select` & `reInit` dengan area sentuh minimal 44 px (`min-h-11 min-w-11`) dan atribut ARIA (`role="tab"`, `aria-selected`, `aria-label`).
- **Lokasi Rakernas (S5)**: Komponen client `location-section.tsx` memuat visual banner utama Hotel Grasia berasio `16/9`, kartu alamat terintegrasi ikon `MapPin`, dan tombol aksi eksternal Google Map (`target="_blank" rel="noopener noreferrer"`).
- **Galeri 8 Foto & Modal Pembesaran**: Galeri fasilitas hotel (8 foto berurutan dari Gedung Utama hingga Area Parkir) dimuat dalam Carousel responsif (`basis-[85%] sm:basis-1/2 lg:basis-1/3`, rasio `4/3`). Mengetuk/mengklik foto memicu `Dialog` modal yang menampilkan foto resolusi penuh beserta keterangan, dapat ditutup melalui tombol silang, tombol Close, klik backdrop, maupun tombol `Esc`.
- **Pengujian & Build**: Unit test `tests/rakernas-fase4.test.ts` (21 uji kasus) memverifikasi komponen, breakpoints, urutan 8 foto, modal dialog, atribut responsive `sizes`, serta audit kepatuhan token warna Tailwind. Total 150 uji unit Vitest lulus 100%, linting ESLint bersih 0 error 0 warning, `app/globals.css` bersih tanpa modifikasi, dan `npm run build` sukses mengompilasi route `/` sebagai Static Page.

### Fase 5 — Transportasi, Pendaftaran, Footer (Selesai)
- **Info Transportasi (S6)**: Komponen client `transport-accordion.tsx` menampilkan 6 titik asal (Bandara Ahmad Yani, Stasiun Tawang, Stasiun Poncol, Terminal Mangkang, Terminal Terboyo, Terminal Banyumanik) dengan total 18 tarif moda transportasi yang cocok persis dengan PRD A.5. Menggunakan shadcn `Accordion` berbasis Base UI primitive (`type="single"` collapsible, default item pertama terbuka). Layout responsif 2 kolom pada layar besar (`lg:grid-cols-12`, judul/subjudul sticky di kiri, accordion di kanan).
- **Ikon Moda & Target Sentuh**: Menggunakan ikon `Plane`, `TrainFront`, dan `Bus` di dalam lingkaran hijau lembut (`bg-green-100 text-primary`), dengan target sentuh trigger minimal 44 px (`min-h-[44px]`).
- **Cara Mendaftar (S7)**: Komponen client `registration-section.tsx` berlatar tema gelap `display-theme display-bg text-foreground`. Menyajikan 4 langkah pendaftaran bernomor urut (`bg-brand-green text-brand-green-night`).
- **Kartu Rekening Resmi & Salin Interaktif**: Kartu BSI berbingkai emas `border-brand-gold` menampilkan nomor rekening `9999-8866-17` secara tabular `text-brand-gold-soft`. Tombol salin nomor rekening dibungkus shadcn `Tooltip` ("Salin nomor"), menyalin nomor ke clipboard, menampilkan notifikasi sonner `toast.success("Nomor rekening tersalin")`, dan mengubah ikon `Copy` menjadi `Check` selama 2 detik.
- **Tombol Aksi Pendaftaran**: Dua tombol aksi dengan tinggi 48 px (`h-12`) dan lebar penuh di mobile: tombol "Isi Data Peserta" (Google Form) beraksen emas dan tombol "Konfirmasi Pembayaran" (WhatsApp) beroutline putih. Keduanya membuka tab baru (`target="_blank" rel="noopener noreferrer"`) menggunakan Base UI pattern `render={<a ... />}`.
- **Site Footer (S8)**: Komponen `site-footer.tsx` berlatar `bg-brand-green-night text-white` memuat satu logo `public/logo.png` (maksimal tinggi 40 px, alt "Logo Rakernas BMH 2027"), teks resmi tanggal dan hotel (`01-03 Desember 2026 | Hotel Grasia Semarang @2026`), serta tautan resmi "Panitia Rakernas" menuju `https://hidayatullahjateng.or.id/` bergaris bawah. Sesuai keputusan PRD, tidak menyertakan widget penghitung pengunjung.
- **Integritas globals.css & Pengujian**: `app/globals.css` bersih tanpa modifikasi (`git diff --exit-code app/globals.css` lolos). Unit test `tests/rakernas-fase5.test.ts` (19 uji kasus) memverifikasi seluruh komponen, 18 tarif, clipboard, tombol aksi, footer, dan integrasi `app/page.tsx`. Total 169 uji unit Vitest lulus 100%, linting ESLint bersih pada berkas rakernas, dan `npm run build` sukses mengompilasi halaman statis untuk rute `/`.

### Fase 6 — QA & Penyelesaian (Selesai)
- **Suite Pengujian QA Mandiri**: Membuat `tests/rakernas-fase6-qa.test.ts` (20 uji kasus komprehensif) yang mengaudit:
  - 100% kecocokan konten terhadap PRD Bagian A.5 (judul, tema, tanggal, alamat hotel, link Google Maps, 10 agenda Hari 1, fallback Hari 2 & 3, 5 dress code, 8 galeri fasilitas terurut, 6 origin × 3 moda = 18 tarif transportasi, 4 langkah pendaftaran, rekening BSI `9999-8866-17`, tautan aksi, dan footer).
  - Pematuhan aturan penggantian nama A.3 (tidak ada kata lama pada title, H1, dan alt logo; kata wajib tetap dipertahankan pada kutipan tema, nama rekening, dan tautan panitia).
  - Audit kepatuhan token warna Tailwind & tema BMH (PRD B.2 & B.9): memastikan tidak ada kelas warna bawaan terlarang (`green-[2-9]00`, `emerald-*`, `yellow-*`) maupun warna arbitrer hex pada seluruh komponen rakernas.
  - Audit aksesibilitas dan ergonomi: target sentuh tombol minimal 44 px / 48 px, seluruh tautan eksternal memiliki atribut `target="_blank" rel="noopener noreferrer"`, dan seluruh section memiliki `id` anchor dengan offset `scroll-mt-20`.
  - Non-regresi rute sistem eksisting: memastikan rute `/absen`, `/absen/selesai`, `/display`, `/admin`, `/admin/login`, dan `/admin/qr` tetap utuh.
- **Pembersihan Lint Codebase**:
  - Memperbaiki `hooks/use-mobile.ts` dengan memanfaatkan `React.useSyncExternalStore` standar React 19 untuk mengeliminasi error `setState` dalam `useEffect`.
  - Menghapus variabel tak terpakai `shortTitle` pada `components/admin/dashboard-widgets.tsx`.
  - Menyelaraskan prop-sync state di `components/display/attendance-board.tsx` mengikuti pola resmi React recommended state adjustment.
  - Menghilangkan type assertion `as any` pada pengujian `tests/display-helpers.test.ts` dan script capture.
  - `npm run lint` kini lulus 100% dengan status 0 errors dan 0 warnings.
- **Verifikasi Build & Integritas CSS Mutlak**:
  - `npm run test` meloloskan seluruh 189 tes pada 13 file pengujian.
  - `npm run build` berhasil mengompilasi rute `/` sebagai halaman statis (Static Page) tanpa error TypeScript atau hidrasi.
  - `app/globals.css` 100% bersih tanpa modifikasi (`git diff --exit-code app/globals.css` lolos).

### Daftar Status Item Eksternal
| No | Item | Penanggung Jawab | Status |
|---|---|---|---|
| 1 | Isi data rundown Hari 2 dan Hari 3 ke `content/rakernas.ts` | User (Muhaz) | Fallback terpasang & teruji; siap diisi data final jika tersedia |
| 2 | Ganti 14 placeholder di `public/rakernas/` dengan gambar asli | User (Muhaz) | Placeholder berdimensi pas tersedia di `public/rakernas/`; siap diganti foto resmi |
| 3 | Konfirmasi izin penggunaan foto dan materi ke Panitia Rakernas | User (Muhaz) | Dicatat asumsi izin internal |
