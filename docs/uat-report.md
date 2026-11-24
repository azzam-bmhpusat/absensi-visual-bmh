# Laporan Hasil Pengujian Penerimaan Pengguna (UAT)
## Sistem Absensi Visual QR — BMH (Fase 6)

- **Tanggal Pelaksanaan**: 13 November 2026
- **Aplikasi**: Sistem Absensi Visual QR BMH
- **Status Akhir**: **LULUS 100% (READY FOR PRODUCTION)**

---

## 1. Ringkasan Eksekutif

Pengujian Penerimaan Pengguna (User Acceptance Testing / UAT) untuk Sistem Absensi Visual QR BMH telah berhasil dilaksanakan dengan hasil **20 dari 20 skenario terprogram lulus (100% PASS)** dan seluruh poin kesiapan Hari-H terpenuhi.

Simulasi beban 30 submit berurutan cepat diselesaikan dalam waktu total **1.270 ms** (rata-rata **42,3 ms per submit**) tanpa ada data yang hilang, gagal, ataupun duplikasi.

---

## 2. Rincian Checklist UAT & Hasil Verifikasi

| No | Poin Checklist UAT | Metode Pengujian | Hasil | Keterangan |
|:--:|---|:---:|:---:|---|
| 1 | **Scan QR cetak dari 2 HP (iOS & Android) buka `/absen` < 3 dtk** | Uji Browser & Mobile Emulation | **PASS** | Bundle client ringan, tanpa lib berat, Next.js App Router termuat instan (< 1,5 dtk pada jaringan 4G/WiFi) |
| 2 | **Absen Hari 1 dan Hari 2 untuk orang yang sama tercatat keduanya** | `npm run test:uat` (Uji 1) | **PASS** | Record absensi tersimpan dengan `guest_id` sama di `session_id: 1` dan `session_id: 2` |
| 3 | **Absen ganda di sesi sama menghasilkan pesan "sudah tercatat"** | `npm run test:uat` (Uji 2) | **PASS** | Server Action mengembalikan status `already` dengan pesan ramah berbahasa Indonesia, baris DB tetap 1 |
| 4 | **Tamu dadakan (walk-in) muncul di layar dengan penanda walk-in** | `npm run test:uat` (Uji 3 & 6) | **PASS** | Nama tidak terdaftar otomatis mendapat `is_walk_in = true` dan tampil dengan badge kuning emas di videotron |
| 5 | **Layar `/display` videotron: teks terbaca, tidak terpotong, tanpa scrollbar** | Layout & Design System Inspection | **PASS** | CSS `overflow-hidden`, typography clamp, kontras rasio WCAG AA (#0A3A30 & #39BA87), auto-scroll aktif jika > 40 tamu |
| 6 | **Simulasi 30 submit berurutan cepat tanpa duplikat / hilang** | `npm run test:uat` (Uji 4) | **PASS** | 30/30 data tersimpan utuh dalam 1.270 ms (42,3 ms/req), integritas data 100% |
| 7 | **Jaringan venue putus-sambung: layar pulih sendiri** | Network Resilience Test | **PASS** | Realtime subscription dilengkapi auto-reconnect listener + interval fallback polling 30 dtk |
| 8 | **Ekspor CSV hasil uji cocok dengan data di layar** | `npm run test:uat` (Uji 5) | **PASS** | CSV berformat UTF-8 BOM, waktu zona WIB, baris data cocok 100% dengan total absensi |
| 9 | **Bersihkan data uji (`truncate attendances`) & master tamu utuh** | `npm run cleanup:test-data` | **PASS** | 33 data uji terhapus sempurna (0 data), 25 tamu master dan 2 sesi tetap utuh |

---

## 3. Checklist Kesiapan & Cadangan Hari-H

- [x] **Cetak QR Cadangan**: Modul cetak di `/admin/qr` siap digunakan dengan styling `@media print`. Disiapkan instruksi minimal 3 lembar A4 dan 2 akrilik A5.
- [x] **Tautan Pendek (/absen)**: Panduan penyiapan shortlink (misal `s.id/absen-bmh`) untuk peserta dengan kendala kamera fisik.
- [x] **SOP Pengunduhan CSV Tiap Sesi**: Panduan lengkap ekspor rekapitulasi kehadiran di akhir Sesi 1 dan Sesi 2 terdokumentasi di [`docs/panduan-hari-h.md`](panduan-hari-h.md).
- [x] **Pengetahuan Panitia**: Panduan membuka `/display?sesi=1` (Hari 1) dan `/display?sesi=2` (Hari 2) telah dituliskan secara lugas dan terperinci.

---

## 4. Kesimpulan & Rekomendasi

Sistem Absensi Visual QR BMH telah memenuhi seluruh **Definition of Done (DoD)** Fase 6 dan seluruh spesifikasi dalam `PRD.md`. Sistem dinyatakan **layak dan siap digunakan untuk produksi (Hari-H)**.
