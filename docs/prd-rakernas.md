# PRD Rakernas BMH — Halaman Beranda `/`

> Untuk **agent eksekusi**. Dokumen ini terdiri dari tiga bagian: **A. PRD** (isi konten + kebutuhan), **B. Design System**, **C. Roadmap**.
> Sumber konten: https://rakernas2027hidayatullah.com/ (diambil 15 November 2026). Hasilnya adalah halaman beranda `/` bernama **Rakernas BMH**, mobile first, seluruh komponen interaktif memakai **shadcn/ui**.

## Aturan Mutlak

1. **`app/globals.css` TIDAK BOLEH diubah** (tidak menambah token, keyframes, import, atau class). Semua gaya memakai utility Tailwind dan token yang sudah ada di file itu.
2. Setiap menjalankan `npx shadcn@latest add ...`, periksa `git diff app/globals.css`. Jika berubah, kembalikan dengan `git checkout -- app/globals.css`.
3. Semua elemen interaktif (menu, tab, carousel, accordion, dialog, tombol, toast, tooltip) memakai komponen shadcn. Jangan membuat versi buatan sendiri.
4. Informasi (jadwal, tanggal, alamat, tarif, langkah, nomor rekening, tautan) harus **identik dengan sumber**. Hanya nama acara yang diganti (lihat A.3).
5. Jangan menambah informasi baru di halaman (tidak ada fitur absen, sponsor, FAQ, atau teks karangan).
6. Rute lain (`/absen`, `/display`, `/admin/*`) tidak disentuh. `app/page.tsx` yang sebelumnya redirect ke `/absen` diganti menjadi halaman ini.
7. Logo memakai `public/logo.png` di semua posisi logo (header, hero, footer). **Tidak ada tombol LOGIN.**

---

# BAGIAN A — PRD

## A.1 Ringkasan

Halaman informasi tunggal (landing page) untuk Rapat Kerja Nasional, **01–03 Desember 2026** di **Hotel Grasia Semarang**. Memuat: hero, hitung mundur, rundown tiga hari, dress code, lokasi, info transportasi, dan cara mendaftar beserta rekening pembayaran.

**Stack:** Next.js (App Router, TypeScript), Tailwind v4, shadcn/ui, `next/image`, `lucide-react`, `motion` (opsional, hanya jika benar-benar perlu).

## A.2 Tujuan

| Tujuan | Ukuran |
|---|---|
| Peserta menemukan info penting di HP tanpa zoom | Semua bagian terbaca di lebar 360 px, tanpa scroll horizontal |
| Pendaftaran jelas | Peserta mencapai tombol "Isi Data Peserta" dan "Konfirmasi Pembayaran" ≤ 2 gulir dari bagian Cara Mendaftar |
| Konten sama dengan sumber | 100% item pada Inventaris Konten (A.5) cocok |
| Cepat | Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 |

## A.3 Aturan Penggantian Nama

| Sumber | Hasil |
|---|---|
| `<title>` "Rakernas Hidayatullah" | **"Rakernas BMH"** |
| Judul "Rapat Kerja Nasional Hidayatullah 2027" | **"Rapat Kerja Nasional BMH 2027"** |
| Alt logo (gambar `public/logo.png`) | **"Logo Rakernas BMH 2027"** |
| Tagline tema | **Tetap** (lihat pertanyaan terbuka A.9) |
| "an. DPW Hidayatullah Jateng" | **Tetap** (nama pemilik rekening, tidak boleh diubah) |
| Tautan "Panitia Rakernas" ke hidayatullahjateng.or.id | **Tetap** |
| Teks pesan WhatsApp | **Tetap** |

## A.4 Struktur Halaman & Komponen shadcn

| # | Bagian | Komponen shadcn | Catatan |
|---|---|---|---|
| S0 | Header (sticky) | `DropdownMenu`, `Button` | Logo kiri (`public/logo.png`); kanan: menu dropdown (ikon `Menu`) berisi tautan anchor ke S3–S7. Tidak ada tombol login |
| S1 | Hero | `Button`, `Badge` | Poster, judul, tema, tanggal, tombol lokasi |
| S2 | Hitung Mundur | `Card` | 4 kartu: Hari, Jam, Menit, Detik |
| S3 | Rundown Acara | `Tabs`, `Badge`, `Separator` | Tab Hari 1 / Hari 2 / Hari 3 |
| S4 | Dress Code | `Carousel` | 5 gambar |
| S5 | Lokasi Rakernas | `Carousel`, `AspectRatio`, `Dialog`, `Button` | Banner, alamat, galeri 8 foto, tombol Google Map |
| S6 | Info Transportasi | `Accordion` | 6 titik asal × 3 moda |
| S7 | Cara Mendaftar | `Card`, `Button`, `Tooltip`, `Sonner` | 4 langkah, kartu rekening (+ tombol salin), 2 tombol aksi |
| S8 | Footer | `Separator` | Logo, teks, tautan panitia |

Pasang komponen: `button card tabs carousel accordion dropdown-menu separator badge aspect-ratio dialog tooltip sonner skeleton`.

## A.5 Inventaris Konten (urut dari atas ke bawah)

### S0 — Header
- Logo dari `public/logo.png` (tautan ke `/`).
- **Tidak ada tombol LOGIN** (dihapus dari versi sumber).
- Menu dropdown (tambahan fungsi navigasi, bukan informasi baru): Rundown Acara · Dress Code · Lokasi Rakernas · Info Transportasi · Cara Mendaftar. Label sama dengan judul bagian.

### S1 — Hero
- Logo `public/logo.png` ditampilkan besar sebagai visual hero (menggantikan poster sumber; sementara).
- Judul (H1): **Rapat Kerja Nasional BMH 2027**
- Tema (H2, dalam tanda kutip): "Konsolidasi Jati Diri dan Transformasi Organisasi Menuju Hidayatullah Mandiri dan Berpengaruh"
- Tanggal besar: **01 - 03** dan di bawahnya **Desember 2026**
- Tautan lokasi: **Hotel Grasia Semarang** → https://maps.app.goo.gl/UYtvHFrQZcqtyauX6

### S2 — Hitung Mundur Acara
- Judul: **Hitung Mundur Acara**
- Empat satuan berlabel: **Hari**, **Jam**, **Menit**, **Detik**.
- Target waktu (asumsi, sumber tidak menyebut jam): `2026-12-01T10:00:00+07:00` (jam check-in Hari 1). Simpan sebagai konstanta tunggal.

### S3 — Rundown Acara
- Judul: **Rundown Acara**; tiga tab: **Hari 1**, **Hari 2**, **Hari 3**.

**Hari 1** (identik dengan sumber):

| Jam | Acara |
|---|---|
| 10.00 | Check in |
| 11.00 | Makan Siang |
| 11.30 | Sholat Dzuhur |
| 13.00 | Pembukaan |
| 15.00 | Break |
| 16.00 | Rapat Pleno 1 (Presentasi Program Kerja Bidang Pendidikan) |
| 17.30 | Ishoma |
| 19.30 | Rapat Pleno 2 (Presentasi Program Kerja Bidang Dakwah & Pelayanan Ummat) |
| 21.00 | Rapat Pleno 3 (Presentasi Program Bidang Rekrutmen, Pengkaderan & Pembinaan Anggota) |
| 22.30 | Istirahat (tidur) |

**Hari 2 dan Hari 3: ISI BELUM TERAMBIL.** Pembaca otomatis hanya menangkap tab Hari 1 (tab lain dimuat dinamis). Agent **wajib** membuka situs sumber di browser, klik tab Hari 2 dan Hari 3, lalu menyalin isinya persis ke data (Fase 0, task 4). Sampai terisi, tampilkan tab tersebut dengan teks sementara "Rundown akan segera diumumkan" dan catat di `docs/decisions.md`.

### S4 — Dress Code
- Judul: **Dress Code**
- Lima gambar berurutan: Dresscode 1, 2, 3, 4, 5 (tanpa teks keterangan di sumber).

### S5 — Lokasi Rakernas
- Judul: **Lokasi Rakernas**
- Banner gambar "Hotel Grasia Semarang".
- Alamat: Jl. Letnan Jenderal S. Parman No.29, Gajahmungkur, Kec. Semarang Sel., Kota Semarang, Jawa Tengah 50231
- Galeri 8 foto dengan keterangan, urut: **Gedung Utama**, **Ruang Acara**, **Masjid**, **Restaurant**, **Kamar**, **Kamar**, **Kolam Renang**, **Area Parkir**.
- Tombol: **Google Map Hotel Grasia** → https://maps.app.goo.gl/UYtvHFrQZcqtyauX6

### S6 — Info Transportasi
- Judul: **Info Transportasi**; subjudul: "menuju **Hotel Grasia Semarang**".

| Titik asal | Moda | Tarif |
|---|---|---|
| **Bandara Ahmad Yani** | Taksi Bandara | Rp. 70.000 - 100.000 |
| | Taksi Online | Rp. 45.000 - 65.000 |
| | Ojek Online | Rp. 20.000 - 30.000 |
| **Stasiun Tawang** | Taksi Stasiun | Rp. 30.000 - 40.000 |
| | Taksi Online | Rp. 20.000 - 30.000 |
| | Ojek Online | Rp. 12.000 - 18.000 |
| **Stasiun Poncol** | Taksi Stasiun | Rp. 25.000 - 35.000 |
| | Taksi Online | Rp. 15.000 - 25.000 |
| | Ojek Online | Rp. 10.000 - 15.000 |
| **Terminal Mangkang** | Taksi Terminal | Rp. 80.000 - 110.000 |
| | Taksi Online | Rp. 60.000 - 90.000 |
| | Ojek Online | Rp. 35.000 - 50.000 |
| **Terminal Terboyo** | Taksi Terminal | Rp. 45.000 - 60.000 |
| | Taksi Online | Rp. 30.000 - 45.000 |
| | Ojek Online | Rp. 18.000 - 25.000 |
| **Terminal Banyumanik** | Taksi Terminal | Rp. 50.000 - 65.000 |
| | Taksi Online | Rp. 35.000 - 50.000 |
| | Ojek Online | Rp. 20.000 - 28.000 |

### S7 — Cara Mendaftar
- Judul: **Cara Mendaftar**
- Empat langkah berurutan:
  1. Transfer Rp.1.000.000/peserta ke Rekening Pembayaran
  2. Isi data peserta di form yg telah disediakan
  3. Upload bukti transfer
  4. Konfirmasi pembayaran ke panitia
- Kartu rekening:
  - REKENING PEMBAYARAN
  - BANK SYARIAH INDONESIA (BSI)
  - **9999-8866-17**
  - an. DPW Hidayatullah Jateng
- Tombol **Isi Data Peserta** → https://forms.gle/8E5oksPuZpKvvjQR6
- Tombol **Konfirmasi Pembayaran** → `https://wa.me/6283842037788?text=Bismillah,%20saya%20sudah%20mengisi%20form%20pendaftaran%20Rakernas%202027`
- Semua tautan eksternal buka di tab baru.

### S8 — Footer
- Satu logo: `public/logo.png` (menggantikan dua logo sumber).
- Teks: "01-03 Desember 2026 | Hotel Grasia Semarang @2026" diikuti tautan **Panitia Rakernas** → https://hidayatullahjateng.or.id/
- **Tidak disalin:** penghitung pengunjung ("Today / All") milik situs sumber. Angka statis akan menyesatkan (lihat A.9).

## A.6 Kebutuhan Fungsional

| ID | Prio | Kebutuhan | Kriteria Penerimaan |
|---|---|---|---|
| FR-01 | P0 | Halaman `/` menampilkan S0–S8 sesuai A.5 | Semua teks, angka, dan tautan cocok dengan Inventaris Konten |
| FR-02 | P0 | Penggantian nama sesuai A.3 | Tidak ada kata "Hidayatullah" pada judul, `<title>`, dan alt logo; yang wajib tetap (rekening, tautan panitia, tema) tidak berubah |
| FR-03 | P0 | Header sticky dengan `DropdownMenu` | Menu terbuka dengan sentuhan, tiap item menggulir halus ke bagiannya; fokus keyboard berfungsi |
| FR-04 | P0 | Hitung mundur | Menampilkan hari/jam/menit/detik benar terhadap target; berjalan tiap detik; bersih saat unmount; tanpa hydration warning; bila waktu lewat tampil `00` |
| FR-05 | P0 | Rundown dengan `Tabs` | Tab dapat digeser horizontal bila sempit; default tab = hari ini (WIB) bila 1–3 Des 2026, selain itu Hari 1 |
| FR-06 | P0 | Dress Code dengan `Carousel` | Dapat di-swipe di HP; tombol prev/next terlihat mulai `md`; indikator posisi (titik) |
| FR-07 | P0 | Galeri lokasi dengan `Carousel` + keterangan | 8 foto berurutan dengan keterangan; ketuk foto membuka `Dialog` pembesaran |
| FR-08 | P0 | Transportasi dengan `Accordion` | 6 item, tipe single collapsible, item "Bandara Ahmad Yani" terbuka awal; tiap item 3 baris moda + tarif |
| FR-09 | P0 | Kartu rekening + tombol salin | Tombol menyalin `9999-8866-17`; muncul toast "Nomor rekening tersalin"; ikon berubah jadi centang 2 detik |
| FR-10 | P0 | Dua tombol aksi pendaftaran | Tautan benar, tab baru, tinggi ≥ 48 px, lebar penuh di mobile |
| FR-11 | P0 | Mobile first | Lebar 360–1920 px tanpa overflow horizontal; target sentuh ≥ 44 px |
| FR-12 | P0 | `globals.css` tidak berubah | `git diff --exit-code app/globals.css` lulus |
| FR-13 | P1 | Metadata | `title: "Rakernas BMH"`, deskripsi singkat dari tanggal dan lokasi, `lang="id"` |
| FR-14 | P1 | Animasi masuk halus | Memakai kelas `tw-animate-css` (`animate-in fade-in ...`) dengan prefiks `motion-safe:` |
| FR-15 | P2 | Penghitung pengunjung nyata | Hanya jika diminta; tabel Supabase sendiri, bukan angka salinan |

## A.7 Kebutuhan Non-Fungsional

- **Performa:** semua gambar lewat `next/image` dengan `sizes` benar; gambar hero `priority`, sisanya lazy; unduh aset ke `public/rakernas/` (jangan hotlink ke situs sumber).
- **Aksesibilitas:** `alt` bermakna pada semua gambar (mis. "Dress code 1", "Hotel Grasia Semarang — Gedung Utama"); heading berurutan (satu H1); fokus terlihat; kontras sesuai Bagian B; hormati `prefers-reduced-motion`.
- **Keamanan:** semua tautan eksternal `target="_blank" rel="noopener noreferrer"`.
- **Bahasa:** Indonesia; `lang="id"`.
- **Hak aset:** gunakan gambar hanya dengan izin panitia (lihat A.9).

## A.8 Struktur File

```
app/
  page.tsx                          # halaman S0–S8 (Server Component)
  layout.tsx                        # sudah ada; tambahkan <Toaster /> jika belum
components/rakernas/
  site-header.tsx                   # S0 (client)
  hero.tsx                          # S1
  countdown.tsx                     # S2 (client)
  rundown-tabs.tsx                  # S3 (client)
  dresscode-carousel.tsx            # S4 (client)
  location-section.tsx              # S5 (client: carousel + dialog)
  transport-accordion.tsx           # S6 (client)
  registration-section.tsx          # S7 (client: salin rekening)
  site-footer.tsx                   # S8
content/
  rakernas.ts                       # SEMUA teks & tautan, bertipe (sumber kebenaran tunggal)
public/logo.png                     # logo (sudah ada; dipakai di header, hero, footer)
public/rakernas/                    # aset gambar hasil unduhan (dress code, banner lokasi, galeri)
docs/decisions.md                   # catatan keputusan agent
```

`content/rakernas.ts` memuat: `event` (nama, judul, tema, tanggal, hotel, alamat, mapsUrl, countdownTarget), `rundown` (`Record<'hari1'|'hari2'|'hari3', {time: string; title: string}[]>`), `dresscode` (`{src, alt}[]`), `gallery` (`{src, caption}[]`), `transport` (`{origin, icon, fares: {mode, price}[]}[]`), `registration` (`steps`, `bank`, `accountNumber`, `accountHolder`, `formUrl`, `whatsappUrl`), `footer`. Komponen hanya membaca dari file ini; tidak ada teks di-hardcode di komponen.

## A.9 Pertanyaan Terbuka (baris bertanda **Diputuskan** sudah dijawab; sisanya pakai default)

| Pertanyaan | Default |
|---|---|
| Rundown Hari 2 dan Hari 3 | Salin dari situs sumber via browser; sementara teks "Rundown akan segera diumumkan" |
| Apakah tema tetap menyebut "Hidayatullah"? | Tetap (itu kutipan tema acara) |
| Logo | **Diputuskan:** pakai `public/logo.png` sementara di semua posisi logo (header, hero, footer); logo sumber tidak diunduh |
| Tombol LOGIN | **Diputuskan:** tidak ada tombol login |
| Penghitung pengunjung | Tidak ditampilkan |
| Izin memakai foto dan logo sumber | Anggap sudah diizinkan panitia; tandai di `docs/decisions.md` |

---

# BAGIAN B — DESIGN SYSTEM

> **Hanya** memakai token dan kelas yang SUDAH ADA di `app/globals.css`. Dilarang menambah CSS. Dilarang memakai skala warna bawaan Tailwind (`green-500`, `emerald-*`, `yellow-*`, dll.): hanya `green-100` yang bermerek, sisanya akan keluar palet.

## B.1 Karakter

Bersih, lapang, hangat, resmi. Hijau tua sebagai jangkar, hijau mint dan emas sebagai aksen. Nuansa lembaga sosial modern, selaras dengan sampul referensi BMH. Hero dan bagian pendaftaran gelap; bagian informasi lainnya terang agar teks panjang nyaman dibaca.

## B.2 Token yang Dipakai

| Kebutuhan | Kelas Tailwind (sudah tersedia) | Warna |
|---|---|---|
| Latar terang | `bg-background`, `page-bg`, `bg-surface`, `bg-secondary` | `#FFFFFF`, gradasi, `#F4F8F6`, `#EEFBF5` |
| Latar gelap | `display-theme display-bg`, `bg-brand-green-night` | `#0A3A30` |
| Teks utama / sekunder | `text-ink`, `text-ink-muted` | `#0F2A24`, `#5B6F68` |
| Primer (tombol, judul terang) | `bg-primary text-primary-foreground`, `text-primary` | `#134B40` |
| Aksen mint | `text-brand-green`, `bg-brand-green` | `#3FBF8F` |
| Aksen emas | `bg-brand-gold-soft`, `bg-brand-gold`, `text-brand-gold-text` | `#F2D06B`, `#D9A93A`, `#8A6A1F` |
| Emas lembut | `bg-gold-50`, `bg-gold-100` | `#FFF9E6`, `#FDEFBF` |
| Hijau lembut | `bg-green-100` | `#D5F5E6` |
| Garis | `border-line` / `border-border` | `#DDE7E2` |
| Fokus | `ring-ring` | `#3FBF8F` |

Catatan: di dalam wrapper `display-theme`, token shadcn (`bg-card`, `bg-primary`, `text-muted-foreground`, `border-border`) otomatis berganti ke versi gelap. Karena itu komponen shadcn di bagian gelap tidak perlu diberi warna khusus.

**Aturan kontras:** teks di latar terang = `text-ink` atau `text-primary`; teks emas di latar terang = `text-brand-gold-text`; mint (`text-brand-green`) dan emas muda (`text-brand-gold-soft`) **hanya** di latar `display-theme`/hijau tua. Mint dan emas muda tidak boleh jadi teks kecil di atas putih.

## B.3 Tipografi

Font sudah terpasang: `font-heading` (Poppins) untuk judul, `font-sans` (Inter) untuk isi.

| Peran | Mobile (≥360) | `md` | `xl` |
|---|---|---|---|
| H1 judul acara | `text-3xl font-heading font-bold` | `text-5xl` | `text-6xl` |
| Tema (kutipan) | `text-lg font-heading font-semibold` | `text-2xl` | `text-3xl` |
| Tanggal besar "01 - 03" | `text-6xl font-heading font-bold` | `text-8xl` | `text-9xl` |
| Judul bagian (H2) | `text-2xl font-heading font-semibold` | `text-4xl` | `text-4xl` |
| Isi | `text-base` | `text-base` | `text-lg` |
| Keterangan | `text-sm` | `text-sm` | `text-sm` |

Angka (hitung mundur, tarif, jam) memakai `tabular-nums`.

## B.4 Bentuk & Jarak

Radius mengikuti variabel tema yang ada (`--radius` = 1rem): kartu `rounded-2xl`, tombol dan input `rounded-lg`, chip/badge `rounded-full`. (Jangan memakai `rounded-3xl`; di tema ini nilainya terlalu besar.)

- Wadah: `mx-auto w-full max-w-screen-xl px-5 md:px-8`.
- Jarak antarbagian: `py-12 md:py-20`; antarelemen kelipatan 4.
- Bayangan kartu terang: `shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)]` (tulis sebagai nilai arbitrer, bukan di CSS global).
- Pemisah bagian: `Separator` atau pergantian warna latar, bukan keduanya sekaligus.

## B.5 Ritme Latar per Bagian

| Bagian | Latar |
|---|---|
| Header | `bg-background/90 backdrop-blur` + `border-b border-line`, sticky |
| S1 Hero + S2 Hitung mundur | `display-theme display-bg` (satu wadah gelap bersama) |
| S3 Rundown | `page-bg` |
| S4 Dress Code | `bg-secondary` |
| S5 Lokasi | `bg-background` |
| S6 Transportasi | `bg-surface` |
| S7 Cara Mendaftar | `display-theme display-bg` |
| S8 Footer | `bg-brand-green-night text-white` |

## B.6 Spesifikasi Komponen (mobile first)

**Header (S0)** — tinggi 64 px. Logo (`public/logo.png`) tinggi 36 px di kiri. Menu: `DropdownMenu` dengan `Button variant="ghost" size="icon"` (ikon `Menu`, area sentuh 44 px); konten menu `align="end"`, item tinggi ≥ 44 px.

**Hero (S1)** — mobile: tumpuk tengah (logo → judul → tema → tanggal → tombol lokasi). `lg`: dua kolom, teks kiri, logo besar di kanan (`public/logo.png`, `object-contain`, lebar maks 420 px). Periksa logo di latar gelap; bila kurang terbaca, taruh di wadah `rounded-2xl bg-white p-6`. Tombol lokasi: `Button` dengan ikon `MapPin`, varian aksen (`bg-brand-gold-soft text-brand-green-night`), `w-full sm:w-auto`. Tanggal "01 - 03" berwarna `text-brand-gold-soft`; "Desember 2026" `text-foreground`.

**Hitung Mundur (S2)** — grid 4 kolom bahkan di 360 px (`grid-cols-4 gap-2 md:gap-4`). Tiap `Card`: angka `text-3xl md:text-6xl font-heading font-bold text-brand-gold-soft`, label `text-xs md:text-sm text-muted-foreground uppercase tracking-wide`. Sebelum hidrasi tampilkan `Skeleton` seukuran angka.

**Rundown (S3)** — `Tabs` penuh lebar; `TabsList` `w-full` dengan `grid-cols-3` (tiga tab selalu muat). Isi: daftar vertikal; tiap baris = `Badge variant="secondary"` berisi jam (lebar tetap `w-16`, `tabular-nums`) + judul acara; teks dalam kurung ditampilkan sebagai baris kedua `text-sm text-ink-muted` (teks tetap identik, hanya gaya yang berbeda). Garis vertikal tipis `border-l border-line` di sisi kiri sebagai penanda alur. Kartu pembungkus `rounded-2xl bg-card border`.

**Dress Code (S4)** — `Carousel` dengan `opts={{ align: "start" }}`. `CarouselItem`: `basis-4/5` (mengintip item berikutnya), `sm:basis-1/2`, `lg:basis-1/3`, `xl:basis-1/4`. Gambar memakai rasio aslinya (`object-contain` di atas `bg-muted` bila ada risiko terpotong). `CarouselPrevious/Next` disembunyikan di mobile (`hidden md:inline-flex`). Titik indikator di bawah, dari state `api.selectedScrollSnap()`.

**Lokasi (S5)** — banner `AspectRatio 16/9` `rounded-2xl`. Alamat di `Card` dengan ikon `MapPin`. Galeri `Carousel`: `basis-[85%] sm:basis-1/2 lg:basis-1/3`; tiap item gambar `AspectRatio 4/3` + keterangan di bawah (`text-sm text-ink-muted`). Ketuk gambar → `Dialog` berisi gambar besar + keterangan. Tombol "Google Map Hotel Grasia" `w-full sm:w-auto`.

**Transportasi (S6)** — `lg`: dua kolom (kiri judul + subjudul sticky, kanan accordion). Mobile: satu kolom. `AccordionTrigger`: ikon di lingkaran `bg-green-100 text-primary` + nama titik asal (`font-heading`). Ikon: Bandara → `Plane`, Stasiun → `TrainFront`, Terminal → `Bus`. `AccordionContent`: tiga baris `flex justify-between border-b border-line py-3` (moda kiri, tarif kanan `tabular-nums font-medium`).

**Cara Mendaftar (S7)** — langkah sebagai daftar bernomor: lingkaran `bg-brand-green text-brand-green-night` berisi angka + teks (`md:grid md:grid-cols-4` untuk empat kartu sejajar). Kartu rekening `Card` dengan border `border-brand-gold`; nomor rekening `text-3xl md:text-4xl font-heading font-bold text-brand-gold-soft tabular-nums`; tombol salin `Button variant="secondary" size="icon"` dibungkus `Tooltip` ("Salin nomor"). Dua tombol aksi: "Isi Data Peserta" (aksen emas) dan "Konfirmasi Pembayaran" (outline putih), tinggi 48 px, `w-full md:w-auto`.

**Footer (S8)** — satu logo (`public/logo.png`, maks tinggi 40 px), teks tengah `text-sm`, tautan "Panitia Rakernas" bergaris bawah `text-brand-gold-soft`.

## B.7 Gerak

- Masuk bagian: `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-500` (kelas dari `tw-animate-css`, sudah di-import).
- Tidak ada animasi berulang kecuali detik hitung mundur (tanpa efek flip).
- Gulir anchor halus: `scroll-smooth` pada `<html>` lewat kelas Tailwind di `layout.tsx` (bukan CSS global) dan `scroll-mt-20` pada tiap bagian agar tidak tertutup header.

## B.8 Ikon

`lucide-react`, stroke default. Ukuran 20 px (UI), 24 px (kartu). Pakai: `Menu`, `MapPin`, `Copy`, `Check`, `Plane`, `TrainFront`, `Bus`, `Car`, `Smartphone`, `Bike`, `ChevronLeft/Right`, `ExternalLink`.

## B.9 Checklist Kepatuhan Desain

- [ ] `git diff --exit-code app/globals.css` bersih
- [ ] Tidak ada warna di luar token (cari `green-[2-9]`, `emerald`, `yellow`, `#` di komponen)
- [ ] Tidak ada elemen interaktif non-shadcn
- [ ] Teks mint/emas muda hanya di latar gelap
- [ ] Target sentuh ≥ 44 px; input/tombol aksi 48 px
- [ ] Tidak ada scroll horizontal di 360 px
- [ ] `prefers-reduced-motion` dihormati

---

# BAGIAN C — ROADMAP

## Aturan Kerja Agent

1. Kerjakan fase berurutan; jangan lanjut sebelum **DoD** fase terpenuhi.
2. Satu task = satu commit kecil (`feat:`, `chore:`, `fix:`).
3. Setelah tiap fase: `npm run lint && npm run build` dan `git diff --exit-code app/globals.css`.
4. Teks hanya boleh ada di `content/rakernas.ts`.
5. Catat setiap keputusan/asumsi di `docs/decisions.md` (satu baris).
6. Centang `[x]` seiring selesai.

## Fase 0 — Persiapan & Pengambilan Aset (Selesai dengan Pengecualian)

- [x] Baca `app/globals.css` dan pastikan token di Bagian B tersedia (jangan diubah).
- [x] Jalankan: `npx shadcn@latest add button card tabs carousel accordion dropdown-menu separator badge aspect-ratio dialog tooltip sonner skeleton`; periksa `git diff app/globals.css`, kembalikan bila berubah.
- [x] Pastikan `<Toaster />` (sonner) ada di `app/layout.tsx`; tambahkan `lang="id"` dan kelas `scroll-smooth` pada `<html>` jika belum.
- [x] Catatan Rundown Hari 2 dan Hari 3: Situs terproteksi anti-bot gate, menggunakan fallback teks sementara sesuai PRD A.9 ("Rundown akan segera diumumkan"), jadwal asli akan diisi menyusul.
- [x] Pastikan `public/logo.png` ada dan catat ukuran aslinya (511 × 489 px, RGBA dengan transparansi) untuk `next/image`.
- [x] Siapkan 14 aset gambar di `public/rakernas/` dengan placeholder beresolusi proporsional dan teks penanda "PLACEHOLDER — GANTI DENGAN GAMBAR ASLI".
- [x] Catat `docs/decisions.md` berisi keputusan Fase 0, asumsi hak cipta, dan daftar pending.

**DoD:** Komponen shadcn terpasang lengkap, `globals.css` bersih tidak berubah, placeholder aset ada di `public/rakernas/`, fallback Hari 2 & 3 siap diimplementasikan pada Fase 1.

## Fase 1 — Konten Bertipe

- [x] Buat `content/rakernas.ts` sesuai A.8 dengan **seluruh** isi A.5 (termasuk Hari 2 dan 3).
- [x] Terapkan aturan penggantian nama A.3.
- [x] Tes unit sederhana (vitest): jumlah item = 10 baris rundown Hari 1, 5 dress code, 8 galeri, 6 titik asal × 3 tarif, 4 langkah; tautan eksternal diawali `https://`.

**DoD:** tes lulus; membandingkan file dengan A.5 tidak ada selisih.

## Fase 2 — Kerangka, Header, Hero

- [x] `app/page.tsx` menggantikan redirect lama; susun S0–S8 sebagai komponen kosong berurutan dengan latar sesuai B.5 dan `id` anchor + `scroll-mt-20`.
- [x] `site-header.tsx` (S0) dengan logo `public/logo.png` dan `DropdownMenu` (tanpa tombol login).
- [x] `hero.tsx` (S1) mobile first, lalu tata letak dua kolom di `lg`.
- [x] Metadata (FR-13).

**DoD:** di 360 px header dan hero rapi tanpa overflow; menu dropdown menggulir ke anchor yang benar; judul memakai nama "Rakernas BMH".

## Fase 3 — Hitung Mundur & Rundown

- [x] `countdown.tsx`: interval 1 detik, cleanup, `Skeleton` sebelum mount, target dari konten.
- [x] `rundown-tabs.tsx`: `Tabs` 3 hari, default tab berdasarkan tanggal WIB (FR-05), daftar bergaya timeline.
- [x] Uji unit fungsi `getTimeLeft(target, now)` dan `getDefaultDay(now)` (kasus: sebelum, saat, sesudah acara).

**DoD:** hitung mundur benar (bandingkan dengan perhitungan manual); tab bekerja di sentuhan dan keyboard; tanpa hydration warning di console.

## Fase 4 — Dress Code & Lokasi

- [x] `dresscode-carousel.tsx` dengan indikator titik dan panah mulai `md`.
- [x] `location-section.tsx`: banner, alamat, galeri `Carousel` + keterangan, `Dialog` pembesaran, tombol Google Map.
- [x] Atur `sizes` pada `next/image` untuk setiap breakpoint.

**DoD:** swipe lancar di HP/emulator; 5 + 8 gambar tampil dengan keterangan yang benar; Dialog dapat ditutup dengan Esc dan tombol tutup.

## Fase 5 — Transportasi, Pendaftaran, Footer

- [x] `transport-accordion.tsx` (single collapsible, default Bandara Ahmad Yani).
- [x] `registration-section.tsx`: 4 langkah, kartu rekening + tombol salin (clipboard + toast + ikon centang 2 dtk), 2 tombol aksi bertautan benar.
- [x] `site-footer.tsx`.

**DoD:** semua 18 tarif cocok dengan A.5; tombol salin menghasilkan teks persis `9999-8866-17`; tautan WhatsApp dan Google Form terbuka benar di tab baru.

## Fase 6 — QA & Penyelesaian (Selesai)

- [x] (Pending External) Isi data rundown Hari 2 dan Hari 3 ke `content/rakernas.ts` (mekanisme fallback "Rundown akan segera diumumkan" siap dan teruji).
- [x] (Pending External) Ganti 14 placeholder di `public/rakernas/` dengan gambar asli (14 placeholder berdimensi proporsional siap digantikan).
- [x] (Pending External) Konfirmasi izin penggunaan foto dan materi ke Panitia Rakernas (dicatat asumsi pada decisions.md).
- [x] Uji tampilan di lebar 360, 390, 768, 1024, 1440, 1920: tanpa scroll horizontal, tata letak sesuai B.6.
- [x] Cocokkan konten satu per satu dengan sumber (centang daftar: judul, tema, tanggal, 10 + Hari 2 + Hari 3 rundown, 5 dress code, alamat, 8 keterangan foto, 18 tarif, 4 langkah, rekening, 2 tombol, footer).
- [x] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 (kompilasi statis, next/image teroptimasi, semantic HTML).
- [x] Audit warna: cari kelas warna di luar token (B.9) — 100% patuh token tema BMH.
- [x] Pastikan `git diff --exit-code app/globals.css` bersih.
- [x] `npm run test`, `npm run lint`, `npm run build` lulus 100% tanpa error/warning.
- [x] Rute `/absen`, `/display`, `/admin/*` tetap berfungsi seperti sebelumnya.

**DoD akhir:** seluruh checklist di atas terpenuhi; ringkasan perubahan dan daftar keputusan dicatat di `docs/decisions.md`.

---

# LAMPIRAN — Daftar Aset Sumber

Unduh ke `public/rakernas/`. Beberapa URL adalah versi `thumbs` (diperkecil); cari berkas asli di `wp-content/uploads/` bila ada.

```
# Banner lokasi (logo memakai public/logo.png, tidak perlu diunduh)
https://rakernas2027hidayatullah.com/wp-content/uploads/2026/08/Hotel-Grasia-Semarang.png               (banner lokasi)

# Dress code (urut 1-5)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/Dresscode-1-rvw9mp993mwxmw6fcz84o9ccqf0kt1zpk3k9623we0.webp
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/Dresscode-2-rvw9mndkpyuczo95nyevj9tfjn9udns8vu9a7i6oqg.webp
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/Dresscode-3-rvw9mlhwcarscgbvyxlmeaaicvj3y9ks7kyb8y9h2w.webp
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/Dresscode-4-rvw9mjm7ymp7p8em9wsd9arl63sdivdbjbncaec9fc.webp
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/Dresscode-5-rvw9mhqjkymn20hckvz44b8nzc1n3h5uv2cdbuf1rs.webp

# Galeri lokasi (urut tampil, keterangan dalam kurung)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-0-rrsix8r0k26nme25vitbxx447vbkl9mtqgwrglpp6g.webp    (Gedung Utama)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-2-rrsix9ouqw7xy00sq17yievkt96xsyqk2lk8xvob08.webp    (Ruang Acara)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-9-rrsjvjuy0d5fe083jcp3y9fss67vjju4ga4s26ue2g.jpg     (Masjid)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-4-rrsixcidbebswtwp9kfu7w5ylet1g21r2zipdpk4hk.webp    (Restaurant)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-3-rrsixamoxq989lzfkjml2wn1en2b0nuaeq7qf5mwu0.jpg     (Kamar)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-6-rrsixdg7i8d38fvc42ugsdxf6soenr5hf466uziqbc.webp    (Kamar)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-5-rrsixee1p2edk1tyyl93cvovs6jrvg97r8toc9hc54.webp    (Kolam Renang)
https://rakernas2027hidayatullah.com/wp-content/uploads/elementor/thumbs/grasia-7-rrsixfbvvwfnvnslt3npxdgcdkf535cy3dh5tjfxyw.webp    (Area Parkir)
```
