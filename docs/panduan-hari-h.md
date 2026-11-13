# Panduan Teknis & Operasional Hari-H
## Sistem Absensi Visual QR — Baitul Maal Hidayatullah (BMH)

Dokumen ini adalah panduan praktis bagi tim panitia registrasi, operator videotron/multimedia, dan administrator teknis pada pelaksanaan acara Silaturahim & Rapat Koordinasi BMH (Acara 2 Hari).

---

## 1. Peran & Tanggung Jawab Tim

| Peran | Tanggung Jawab Utama |
|---|---|
| **Operator Videotron** | Menyiapkan laptop display, membuka `/display?sesi=1` atau `?sesi=2`, memastikan tampilan full-screen (F11), memantau indikator koneksi |
| **Panitia Meja Registrasi** | Memandu peserta scan QR fisik di meja registrasi, membantu tamu lansia/walk-in bila kesulitan, membagikan souvenir/kit |
| **Administrator Teknis** | Login ke `/admin`, memverifikasi daftar tamu, mengunduh rekap CSV di akhir sesi 1 dan sesi 2, menangani isu teknis |

---

## 2. Persiapan Sebelum Acara Dimulai (H-1 / 2 Jam Sebelum Acara)

### 2.1 Pembersihan Data Uji Coba & Verifikasi Tamu Final
Pastikan data absensi uji coba telah dibersihkan sehingga tabel kehadiran bersih (0 data):
```bash
npm run cleanup:test-data
```
Jika ada update daftar tamu undangan resmi dari panitia:
1. Login ke panel admin di `${NEXT_PUBLIC_SITE_URL}/admin/login`.
2. Buka tab **Tamu Undangan**.
3. Klik **Import CSV**, pilih file CSV daftar tamu final (`nama,perwakilan_daerah`), periksa ringkasan pratinjau (valid, duplikat, invalid), lalu klik **Simpan ke Database**.

### 2.2 Pencetakan QR Code & Cadangan Fisik
1. Buka `${NEXT_PUBLIC_SITE_URL}/admin/qr`.
2. Tekan tombol **Cetak QR Code** (atau pintasan `Ctrl + P` / `Cmd + P`).
3. Cetak minimal:
   - **3 lembar ukuran A4** (ditempatkan pada standing banner atau meja registrasi utama).
   - **2 lembar ukuran A5 akrilik** (sebagai cadangan di meja panitia).
4. **Tautan Pendek Cadangan (Shortlink)**:
   - Siapkan tautan pendek resmi seperti `s.id/absen-bmh` atau `bit.ly/absen-bmh` yang diarahkan ke `${NEXT_PUBLIC_SITE_URL}/absen`.
   - Tuliskan tautan pendek ini di bagian bawah standing banner meja registrasi sebagai alternatif jika kamera HP peserta mengalami kendala pembacaan QR.

---

## 3. Pengoperasian Layar Videotron (`/display`)

### 3.1 Membuka Halaman Layar
Hubungkan laptop operator ke videotron/LED display atau proyektor panggung via HDMI, lalu buka browser Google Chrome:
- **Hari Pertama**: Buka URL `${NEXT_PUBLIC_SITE_URL}/display?sesi=1`
- **Hari Kedua**: Buka URL `${NEXT_PUBLIC_SITE_URL}/display?sesi=2`

*(Catatan: Jika URL dibuka tanpa parameter `?sesi=`, sistem otomatis mencocokkan tanggal hari ini WIB atau default ke Sesi 1).*

### 3.2 Konfigurasi Tampilan Layar Penuh
1. Tekan tombol keyboard **F11** (pada Windows) atau `Cmd + Ctrl + F` (pada macOS) untuk beralih ke mode layar penuh (*Fullscreen*).
2. Gerakkan kursor mouse ke tepi layar lalu diamkan: kursor akan menghilang otomatis setelah 3 detik tidak ada aktivitas.
3. Layar dioptimalkan untuk resolusi **1920×1080 (Full HD)** tanpa bilah geser (*scrollbar*).

### 3.3 Indikator Status Koneksi Realtime
Di pojok kanan bawah layar terdapat indikator koneksi:
- 🟢 **Terhubung**: Sistem terhubung dengan server Supabase Realtime; nama peserta baru akan muncul dalam waktu ≤ 2 detik setelah submit.
- 🟡 **Menyambung ulang...**: Koneksi terputus sesaat. Sistem akan otomatis mencoba menyambung ulang (*auto-reconnect*) dan melakukan refetch berkala tiap 30 detik. Operator **tidak perlu merefresh browser**.

---

## 4. Alur Peserta Melakukan Presensi (`/absen`)

1. Peserta memindai QR code dengan kamera HP (iOS / Android) atau membuka tautan `/absen`.
2. Halaman memuat 2 kartu sesi: **Hari Pertama** dan **Hari Kedua**.
3. Peserta mengetuk sesi yang sesuai.
4. Muncul dialog form presensi:
   - **Kolom Nama**: Peserta mengetik namanya. Sistem akan menampilkan saran autocomplete tamu undangan. Jika nama dipilih, kolom **Perwakilan Daerah** terisi otomatis.
   - **Tamu Dadakan (Walk-in)**: Jika nama peserta tidak ada di daftar undangan, peserta bebas mengetik nama lengkap dan perwakilan daerahnya. Sistem otomatis mencatatnya sebagai tamu *walk-in*.
5. Peserta menekan tombol **Hadir**.
6. Dialog berubah menjadi status sukses hijau ("Terima kasih, {nama}. Kehadiran Anda tercatat di {sesi}").
7. Jika peserta mencoba absen kedua kali di sesi yang sama, muncul dialog ramah "Anda sudah tercatat hadir di {sesi}" tanpa membuat data ganda.

---

## 5. SOP Penutupan Sesi & Pengunduhan Rekapitulasi CSV

Di akhir setiap sesi (saat acara Hari Pertama selesai dan saat acara Hari Kedua selesai):
1. Buka `${NEXT_PUBLIC_SITE_URL}/admin`.
2. Buka tab **Rekapitulasi Kehadiran**.
3. Pilih sesi yang bersangkutan (misal: *Hari Pertama*).
4. Klik tombol **Ekspor CSV**:
   - File CSV otomatis diunduh dengan penamaan `rekap-kehadiran-hari-1-YYYY-MM-DD.csv`.
   - File berformat **UTF-8 with BOM**, sehingga dapat langsung dibuka dengan rapi di Microsoft Excel tanpa karakter rusak.
   - Kolom memuat: No, Waktu Presensi (WIB), Sesi, Nama Tamu, Perwakilan Daerah, dan Status Kehadiran (Undangan Terdaftar / Walk-in).
5. Simpan file rekap di Google Drive panitia dan flashdisk cadangan.

---

## 6. Prosedur Penanganan Darurat (Troubleshooting)

| Masalah | Solusi Cepat |
|---|---|
| **Koneksi internet venue terputus** | Videotron akan menampilkan status "Menyambung ulang...". Layar tidak blank. Begitu internet venue aktif kembali, sistem otomatis sinkronisasi penuh data absensi dalam ≤ 30 detik. |
| **Kamera HP peserta gagal membaca QR** | Arahkan peserta mengetik tautan pendek `s.id/absen-bmh` di browser HP mereka (Chrome/Safari). |
| **Peserta double-tap tombol Hadir** | Sistem memiliki tombol *disabled* otomatis saat pengiriman dan proteksi *unique index* database, sehingga tidak ada duplikasi data yang tersimpan. |
| **Terdapat salah ketik nama atau data salah oleh peserta** | Admin dapat login ke `/admin` tab Rekap dan menghapus entri absensi yang keliru melalui tombol aksi hapus (fitur P2). |
