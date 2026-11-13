# Design System — Sistem Absensi QR

> Untuk **agent eksekusi**. Semua warna, font, dan komponen di sini bersifat **wajib**. Jangan memakai warna di luar token. Palet diambil dari sampul publikasi BMH (screenshot referensi): **hijau terang**, **kuning emas**, dan **hijau tua**, di atas latar putih bergradasi lembut.

## 1. Karakter Visual

- Bersih, lapang, ramah, dan resmi (nuansa lembaga sosial/keagamaan modern).
- Latar terang dengan gradasi putih → abu kehijauan sangat tipis, ditambah lengkung (swoosh) dekoratif hijau dan kuning di pojok, seperti sampul referensi.
- Judul besar tebal berwarna hijau tua atau hijau terang; aksen kuning dipakai hemat untuk penanda dan sorotan.
- Sudut membulat besar, bayangan lembut, tanpa garis tebal.

## 2. Palet Warna

Nilai hex disampel dari screenshot lalu dirapikan.

### 2.1 Warna Merek

| Token | Hex | Peran |
|---|---|---|
| `green-500` (hijau terang) | `#3FBF8F` | Aksen utama, ikon, progress, status "hadir" |
| `green-900` (hijau tua) | `#134B40` | Warna primer: tombol, judul, badge |
| `green-950` (hijau paling tua) | `#0A3A30` | Latar videotron, teks di atas kuning/hijau terang |
| `gold-300` (kuning muda) | `#F2D06B` | Sorotan, kata penekanan, swoosh |
| `gold-500` (kuning emas) | `#D9A93A` | Aksen sekunder, penanda walk-in, garis hias |
| `gold-700` (emas tua) | `#8A6A1F` | Teks kuning di atas latar terang (agar terbaca) |

### 2.2 Skala Lengkap

```
green-50   #EEFBF5
green-100  #D5F5E6
green-200  #AEEBCF
green-300  #7ADBB2
green-400  #52CB9C
green-500  #3FBF8F   ← merek
green-600  #2FA075
green-700  #25805F
green-800  #1A6050
green-900  #134B40   ← primer
green-950  #0A3A30

gold-50    #FFF9E6
gold-100   #FDEFBF
gold-200   #F8E08F
gold-300   #F2D06B
gold-400   #E6BC4A
gold-500   #D9A93A
gold-600   #B88A2A
gold-700   #8A6A1F
```

### 2.3 Netral & Semantik

| Token | Hex | Peran |
|---|---|---|
| `ink` | `#0F2A24` | Teks utama (tema terang) |
| `ink-muted` | `#5B6F68` | Teks sekunder |
| `line` | `#DDE7E2` | Border, pemisah |
| `surface` | `#F4F8F6` | Latar muted |
| `white` | `#FFFFFF` | Kartu, latar |
| `danger` | `#D14343` | Error |
| `success` | `#2FA075` | Sukses (= `green-600`) |
| `warning` | `#D9A93A` | Peringatan (= `gold-500`) |

### 2.4 Aturan Kontras (WCAG AA) — penting

| Kombinasi | Rasio kira-kira | Boleh untuk teks? |
|---|---|---|
| `green-900` di atas putih | ≈ 10 : 1 | Ya, semua ukuran |
| Putih di atas `green-900` | ≈ 10 : 1 | Ya |
| `ink` di atas putih | > 12 : 1 | Ya |
| `gold-700` di atas putih | ≈ 5 : 1 | Ya |
| `green-500` di atas `green-950` | ≈ 5,5 : 1 | Ya |
| `gold-500` / `gold-300` di atas `green-950` | ≈ 6 : 1 atau lebih | Ya |
| `green-500` di atas putih | ≈ 2,3 : 1 | **Tidak untuk teks kecil.** Hanya untuk ikon, progress, fill, atau judul sangat besar (≥ 32 px) |
| `gold-500` / `gold-300` di atas putih | < 2,5 : 1 | **Tidak untuk teks.** Hanya untuk fill/hiasan; teks kuning di latar terang pakai `gold-700` |

Aturan praktis: **teks di latar terang = hijau tua atau ink; teks di latar hijau tua = putih, hijau terang, atau kuning.**

## 3. Token CSS (shadcn + Tailwind)

Tempel ke `app/globals.css`. Nilai hex langsung (kompatibel Tailwind v4 / shadcn terbaru). Jika proyek memakai Tailwind v3, konversi ke HSL.

```css
:root {
  --radius: 1rem;

  --background: #FFFFFF;
  --foreground: #0F2A24;

  --card: #FFFFFF;
  --card-foreground: #0F2A24;
  --popover: #FFFFFF;
  --popover-foreground: #0F2A24;

  --primary: #134B40;
  --primary-foreground: #FFFFFF;

  --secondary: #EEFBF5;
  --secondary-foreground: #134B40;

  --muted: #F4F8F6;
  --muted-foreground: #5B6F68;

  --accent: #F2D06B;
  --accent-foreground: #0A3A30;

  --destructive: #D14343;
  --border: #DDE7E2;
  --input: #DDE7E2;
  --ring: #3FBF8F;

  --chart-1: #3FBF8F;
  --chart-2: #134B40;
  --chart-3: #D9A93A;
  --chart-4: #7ADBB2;
  --chart-5: #F2D06B;

  /* token tambahan proyek */
  --brand-green: #3FBF8F;
  --brand-green-deep: #134B40;
  --brand-green-night: #0A3A30;
  --brand-gold: #D9A93A;
  --brand-gold-soft: #F2D06B;
  --brand-gold-text: #8A6A1F;
}

/* Tema videotron: tambahkan class "display-theme" pada wrapper /display */
.display-theme {
  --background: #0A3A30;
  --foreground: #F4FBF8;
  --card: #0F4439;
  --card-foreground: #F4FBF8;
  --popover: #0F4439;
  --popover-foreground: #F4FBF8;

  --primary: #3FBF8F;
  --primary-foreground: #0A3A30;

  --secondary: #134B40;
  --secondary-foreground: #F4FBF8;

  --muted: #0F4439;
  --muted-foreground: #A9CFC2;

  --accent: #F2D06B;
  --accent-foreground: #0A3A30;

  --border: #1F6252;
  --input: #1F6252;
  --ring: #F2D06B;
}
```

Daftarkan juga token tambahan ke Tailwind (`@theme inline` pada v4) agar bisa dipakai sebagai `bg-brand-green`, `text-brand-gold-text`, dst.

## 4. Latar Dekoratif (gaya sampul)

Latar halaman `/absen` dan `/admin` (tema terang): gradasi putih ke abu-hijau tipis, ditambah dua lengkung lembut.

```css
.page-bg {
  background:
    radial-gradient(60% 40% at 100% 0%,  rgba(242, 208, 107, 0.35) 0%, transparent 70%),
    radial-gradient(70% 45% at 100% 100%, rgba(63, 191, 143, 0.30) 0%, transparent 70%),
    radial-gradient(50% 35% at 0% 0%,     rgba(63, 191, 143, 0.18) 0%, transparent 70%),
    linear-gradient(180deg, #FFFFFF 0%, #F1F5F3 100%);
}
```

Latar `/display` (tema gelap): `--background` hijau tua dengan satu radial kuning sangat lembut di pojok kanan atas (`rgba(242,208,107,0.12)`) dan hijau terang di kiri bawah (`rgba(63,191,143,0.15)`). Tanpa pola ramai.

## 5. Tipografi

| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Judul / display | **Poppins** | 600, 700 | Mirip tipografi judul sampul referensi |
| Isi / UI | **Inter** | 400, 500, 600 | Terbaca di layar kecil |

Muat via `next/font/google` dan set `--font-heading` (Poppins) serta `--font-sans` (Inter).

### Skala (tema terang, mobile)

| Token | Ukuran / tinggi baris | Pakai untuk |
|---|---|---|
| `display` | 32 / 40, bobot 700 | Judul halaman |
| `h2` | 24 / 32, bobot 600 | Judul dialog, kartu sesi |
| `body` | 16 / 24 | Isi, input (minimal 16 px agar iOS tidak zoom) |
| `small` | 14 / 20 | Label, bantuan |
| `caption` | 12 / 16 | Catatan kecil |

### Skala videotron (1920×1080)

| Token | Ukuran | Pakai untuk |
|---|---|---|
| `tv-title` | 56 px, bobot 700 | Nama acara |
| `tv-counter` | 96 px, bobot 700 | Angka Hadir / Total |
| `tv-column-title` | 36 px, bobot 600 | "Sudah Hadir", "Belum Hadir" |
| `tv-name` | 32 px, bobot 600 | Nama tamu |
| `tv-meta` | 22 px, bobot 400 | Perwakilan daerah |

Teks videotron tidak boleh di bawah 22 px.

## 6. Bentuk, Jarak, Bayangan

- **Radius:** kartu `24px`, tombol dan input `14px`, chip `999px`.
- **Jarak:** kelipatan 4 px. Padding halaman mobile 20 px; padding videotron 48 px.
- **Bayangan (terang):** `0 8px 24px -8px rgba(19, 75, 64, 0.18)`. Hindari bayangan hitam pekat.
- **Border:** 1 px `--border`; sorotan aktif memakai ring 2 px `--ring`.

## 7. Spesifikasi Komponen

### 7.1 Kartu Sesi (`session-picker`)
- Dua kartu besar bertumpuk (mobile) atau berdampingan (≥ 768 px), tinggi min 140 px.
- Latar putih, border `line`, radius 24 px, bayangan lembut.
- Kiri: lingkaran 56 px `green-100` berisi angka hari (`1` / `2`) warna `green-900`.
- Judul "Hari Pertama" / "Hari Kedua" (Poppins 600, `green-900`); subteks tanggal (jika ada) `ink-muted`.
- Hover/tap: border `green-500`, naik 2 px; ikon panah kuning emas di kanan.

### 7.2 Dialog Absen (`attendance-dialog`)
- Shadcn `Dialog`, lebar maks 440 px; di mobile tampil hampir penuh dengan radius atas 24 px.
- Header: pil kecil `gold-100` / teks `gold-700` bertuliskan sesi ("Hari Pertama"), lalu judul "Konfirmasi Kehadiran".
- Field: Nama, Perwakilan Daerah. Label `small` bobot 500; input tinggi 48 px.
- Tombol **Hadir**: lebar penuh, tinggi 48 px, latar `green-900`, teks putih, hover `green-800`; state pending menampilkan spinner dan disabled.
- State sukses: lingkaran `green-500` dengan ikon centang putih, judul "Terima kasih, {nama}", tombol sekunder "Tutup".
- State "sudah tercatat": ikon info `gold-500`, teks ramah, tanpa warna merah.

### 7.3 Combobox Nama
- Shadcn `Command` dalam `Popover`; item menampilkan nama (tebal) dan daerah (`ink-muted`).
- Opsi terakhir selalu "Gunakan '{teks}' (tamu baru)" dengan ikon plus berwarna `gold-700`.

### 7.4 Chip Tamu (`guest-chip`) — videotron
| Varian | Latar | Teks | Aksen |
|---|---|---|---|
| Hadir | `#134B40` (card) | putih | Titik/ikon centang `green-500` di kiri |
| Belum hadir | transparan, border `#1F6252` | `#A9CFC2` | Tidak ada ikon |
| Walk-in | sama dengan Hadir | putih | Lencana kecil `gold-300` bertuliskan "Tamu baru", teks `green-950` |
| Baru saja hadir (5 dtk) | `#134B40` | putih | Ring 2 px `gold-300` + kilau lembut |

Tinggi chip 72 px, radius 16 px, padding horizontal 24 px. Nama maksimal 2 baris dengan elipsis.

### 7.5 Counter & Progress (videotron)
- Angka `tv-counter` warna `gold-300`, format `{hadir}` besar dan `/ {total}` lebih kecil berwarna `muted-foreground`.
- Progress bar tinggi 16 px, trek `#134B40`, isi gradasi `green-500` → `green-300`, radius penuh.

### 7.6 Banner Sambutan
- Muncul di atas kolom, lebar penuh, latar `gold-300`, teks `green-950`, radius 20 px.
- Isi: "Selamat datang, **{nama}** — {daerah}" (36 px). Masuk dari atas, tahan 5 dtk, keluar memudar.

### 7.7 Tombol
| Varian | Pakai | Gaya |
|---|---|---|
| Primer | Aksi utama | `green-900`, teks putih |
| Sekunder | Aksi pendukung | `green-50`, teks `green-900`, border `green-200` |
| Aksen | Sorotan langka | `gold-300`, teks `green-950` |
| Hantu | Tersier | transparan, teks `green-900` |
| Destruktif | Hapus | `danger`, teks putih |

Fokus keyboard: ring 2 px `--ring` dengan offset 2 px.

## 8. Layout Videotron `/display`

```
┌────────────────────────────────────────────────────────────┐
│ Logo/Nama Acara                     Hari Pertama   10:42 WIB │  header 120px
├────────────────────────────────────────────────────────────┤
│  HADIR  86 / 120   ████████████░░░░░░  72%                   │  counter 160px
├──────────────────────────────┬─────────────────────────────┤
│ ✔ Sudah Hadir                │ ○ Belum Hadir               │
│ [chip] [chip] [chip]         │ [chip] [chip] [chip]        │  dua kolom 50/50
│ ...                          │ ...                         │  auto-scroll bila overflow
├──────────────────────────────┴─────────────────────────────┤
│ ● Terhubung                                   absen.domain  │  footer 48px
└────────────────────────────────────────────────────────────┘
```

- Wrapper `h-screen w-screen overflow-hidden`, padding 48 px.
- Kolom: judul kolom 36 px dengan garis bawah 2 px (`green-500` untuk Hadir, `gold-500` untuk Belum Hadir).
- Grid chip: 2 kolom di dalam tiap kolom besar, gap 16 px.
- Jika daftar Belum Hadir > 40, kelompokkan per Perwakilan Daerah dengan sub-judul `tv-meta` berwarna `gold-300`.

## 9. Gerak (Motion)

- Durasi: 200 ms (mikro), 400 ms (masuk/keluar), easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Nama baru: fade + naik 12 px ke posisi atas; nama keluar dari "Belum Hadir": menyusut dan memudar 300 ms.
- Auto-scroll videotron: 20–30 px/detik, jeda 3 dtk di ujung atas dan bawah.
- Hormati `prefers-reduced-motion`: matikan animasi dan auto-scroll halus (ganti dengan transisi opasitas).

## 10. Ikon

- Pakai `lucide-react`, stroke 2 px. Ukuran 20 px (UI), 28 px (kartu), 40 px (videotron).
- Ikon umum: `Check`, `CircleDashed`, `UserPlus` (walk-in), `Wifi`/`WifiOff` (koneksi), `QrCode`, `Download`, `Upload`.

## 11. Konten & Gaya Bahasa

- Sapaan hangat dan singkat, Bahasa Indonesia baku yang ramah.
- Contoh: tombol "Hadir"; sukses "Terima kasih, {nama}. Kehadiran Anda tercatat."; sudah absen "Anda sudah tercatat hadir di Hari Pertama."; error jaringan "Koneksi bermasalah. Coba lagi sebentar."
- Hindari istilah teknis dan pesan error mentah dari server.

## 12. Checklist Kepatuhan Desain (untuk review akhir)

- [ ] Hanya memakai token warna di dokumen ini
- [ ] Teks `green-500` / `gold-*` tidak dipakai di latar putih untuk teks kecil
- [ ] Input ≥ 16 px dan tinggi ≥ 48 px di mobile
- [ ] Teks videotron ≥ 22 px dan terbaca dari jauh
- [ ] Fokus keyboard terlihat di semua elemen interaktif
- [ ] `prefers-reduced-motion` dihormati
- [ ] Tidak ada warna merah untuk kondisi "sudah absen"
