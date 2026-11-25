-- Seed awal = isi data dummy sebelumnya (penghuni tidak di-seed).

begin;

insert into public.hotel_rooms (nomor, lantai, kapasitas, urutan) values
  ('301', 3, 2, 0),
  ('302', 3, 2, 1),
  ('303', 3, 2, 2),
  ('401', 4, 2, 3),
  ('402', 4, 2, 4),
  ('403', 4, 2, 5),
  ('501', 5, 2, 6),
  ('502', 5, 2, 7),
  ('503', 5, 2, 8)
on conflict (nomor) do nothing;

insert into public.hotel_info_items (judul, isi, urutan) values
  ('Proses check-in', 'Tunjukkan KTP dan sebutkan nama sebagai peserta Rakernas BMH di meja resepsionis. Kunci kamar diambil oleh peserta yang tiba lebih dulu.', 0),
  ('Sarapan', 'Sarapan tersedia pukul 05.30–09.00 WIB di restoran lantai dasar. Acara pagi dimulai pukul 07.30 WIB.', 1),
  ('Tagihan tambahan', 'Panitia menanggung biaya kamar dan sarapan. Minibar, laundry, dan layanan kamar menjadi tanggungan pribadi dan dibayar saat check-out.', 2),
  ('Perubahan kamar', 'Permintaan pindah kamar atau teman sekamar disampaikan ke panitia akomodasi, bukan langsung ke hotel.', 3);

insert into public.hotel_contact (id, nama, whatsapp) values (1, 'Panitia Akomodasi', '6281200000000') on conflict (id) do nothing;

insert into public.gallery_albums (judul, tanggal, lokasi, jumlah_foto, cover_path, deskripsi, drive_url, urutan) values
  ('Pembukaan Rakernas', '2027-02-15', 'Ballroom Utama', 48, '/galeri-fasilitas-hotel/ruang-acara.jpg', 'Seremoni pembukaan, sambutan pimpinan, dan doa bersama seluruh peserta.', 'https://drive.google.com/', 0),
  ('Sidang Pleno', '2027-02-15', 'Ballroom Utama', 36, '/galeri-fasilitas-hotel/gedung.jpg', 'Pemaparan evaluasi program dan arah kebijakan BMH tahun berjalan.', 'https://drive.google.com/', 1),
  ('Sidang Komisi', '2027-02-16', 'Ruang Meeting A–D', 52, '/galeri-fasilitas-hotel/belakang-gedung.jpg', 'Diskusi per komisi untuk menyusun rekomendasi program kerja.', 'https://drive.google.com/', 2),
  ('Ramah Tamah', '2027-02-16', 'Restoran Hotel', 29, '/galeri-fasilitas-hotel/ruang-makan.jpg', 'Makan malam bersama dan silaturahmi antar perwakilan wilayah.', 'https://drive.google.com/', 3),
  ('Kegiatan Peserta', '2027-02-17', 'Area Hotel', 24, '/galeri-fasilitas-hotel/kamar.jpg', 'Momen kebersamaan peserta di sela agenda Rakernas.', 'https://drive.google.com/', 4),
  ('Penutupan & Pengesahan', '2027-02-17', 'Ballroom Utama', 41, '/galeri-fasilitas-hotel/ruang-acara.jpg', 'Pengesahan hasil Rakernas dan seremoni penutupan.', 'https://drive.google.com/', 5);

insert into public.presentation_materials (judul, pemateri, jabatan, sesi, tanggal, format, ukuran, deskripsi, drive_url, urutan) values
  ('Laporan Kinerja BMH', 'Ketua Umum BMH', 'Pimpinan Pusat', 'Sidang Pleno I', '2027-02-15', 'PDF', '3,2 MB', 'Capaian program, penghimpunan, dan penyaluran BMH sepanjang tahun berjalan.', 'https://drive.google.com/', 0),
  ('Arah Kebijakan Program', 'Direktur Program', 'BMH Pusat', 'Sidang Pleno II', '2027-02-15', 'PPTX', '8,5 MB', 'Prioritas program dakwah, pendidikan, sosial, dan ekonomi untuk tahun depan.', 'https://drive.google.com/', 1),
  ('Strategi Fundraising Digital', 'Direktur Penghimpunan', 'BMH Pusat', 'Sidang Komisi A', '2027-02-16', 'PDF', '2,4 MB', 'Optimasi kanal digital, kampanye daring, dan retensi donatur.', 'https://drive.google.com/', 2),
  ('Penguatan SDM & Dai', 'Kepala Divisi SDM', 'BMH Pusat', 'Sidang Komisi B', '2027-02-16', 'PPTX', '5,1 MB', 'Rencana rekrutmen, pembinaan, dan pengembangan kompetensi amil serta dai.', 'https://drive.google.com/', 3),
  ('Tata Kelola Keuangan', 'Direktur Keuangan', 'BMH Pusat', 'Sidang Komisi C', '2027-02-16', 'PDF', '1,8 MB', 'Standar pelaporan, audit syariah, dan akuntabilitas pengelolaan dana.', 'https://drive.google.com/', 4),
  ('Rekomendasi Hasil Komisi', 'Tim Perumus', 'Panitia Rakernas', 'Sidang Pleno Penutupan', '2027-02-17', 'PDF', '1,2 MB', 'Rangkuman rekomendasi seluruh komisi untuk disahkan sebagai hasil Rakernas.', 'https://drive.google.com/', 5);

insert into public.meeting_minutes (judul, tanggal, waktu, tempat, pimpinan, notulis, jumlah_peserta, keputusan, status, drive_url, urutan) values
  ('Sidang Pleno I', '2027-02-15', '09.00–12.00 WIB', 'Ballroom Utama', 'Ketua Umum BMH', 'Sekretariat Rakernas', 210, array['Laporan kinerja tahun berjalan diterima peserta', 'Tata tertib Rakernas disahkan']::text[], 'Final', 'https://drive.google.com/', 0),
  ('Sidang Pleno II', '2027-02-15', '13.30–16.00 WIB', 'Ballroom Utama', 'Direktur Program', 'Sekretariat Rakernas', 205, array['Arah kebijakan program disepakati sebagai acuan komisi', 'Pembagian peserta ke tiga komisi ditetapkan']::text[], 'Final', 'https://drive.google.com/', 1),
  ('Komisi A — Program', '2027-02-16', '08.30–12.00 WIB', 'Ruang Meeting A', 'Koordinator Komisi A', 'Tim Notulis Komisi A', 72, array['Program prioritas dakwah pedalaman diperluas', 'Target penerima manfaat pendidikan dinaikkan', 'Evaluasi program dilakukan per semester']::text[], 'Final', 'https://drive.google.com/', 2),
  ('Komisi B — SDM', '2027-02-16', '08.30–12.00 WIB', 'Ruang Meeting B', 'Koordinator Komisi B', 'Tim Notulis Komisi B', 68, array['Standar kompetensi amil disusun ulang', 'Pelatihan dai dilaksanakan dua kali setahun']::text[], 'Draf', 'https://drive.google.com/', 3),
  ('Komisi C — Keuangan', '2027-02-16', '08.30–12.00 WIB', 'Ruang Meeting C', 'Koordinator Komisi C', 'Tim Notulis Komisi C', 65, array['Pelaporan keuangan wilayah wajib bulanan', 'Audit syariah internal diperkuat']::text[], 'Draf', 'https://drive.google.com/', 4),
  ('Pleno Penutupan', '2027-02-17', '09.00–11.30 WIB', 'Ballroom Utama', 'Ketua Umum BMH', 'Sekretariat Rakernas', 215, array['Rekomendasi seluruh komisi disahkan', 'Hasil Rakernas menjadi pedoman kerja tahun depan']::text[], 'Final', 'https://drive.google.com/', 5);

commit;
