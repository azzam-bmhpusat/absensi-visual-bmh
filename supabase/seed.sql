-- Seed data: Tamu undangan BMH (Perwakilan Daerah, Ketua Daerah, dan Ketua Departemen Pusat)
-- Gunakan ON CONFLICT DO NOTHING agar idempoten (bisa dijalankan berulang)

INSERT INTO public.guests (nama, perwakilan_daerah, jabatan, departemen, kategori) VALUES
  -- Tamu Departemen / Kantor Pusat
  ('Fulan', 'Pusat', 'Ketua Departemen', 'IT', 'departemen'),
  ('Zainab Al-Kubro', 'Pusat', 'Ketua Departemen', 'Fundraising', 'departemen'),
  ('H. Salim Mubarok', 'Pusat', 'Direktur Utama', 'Direksi', 'khusus'),

  -- BMH Jawa Timur (Ketua Daerah + Delegasi)
  ('Ahmad Fauzi', 'BMH Jawa Timur', 'Ketua Daerah', NULL, 'daerah'),
  ('Siti Khadijah', 'BMH Jawa Timur', NULL, NULL, 'daerah'),
  ('Muhammad Rizki', 'BMH Jawa Timur', NULL, NULL, 'daerah'),
  ('Nur Hidayah', 'BMH Jawa Timur', NULL, NULL, 'daerah'),
  ('Hasan Basri', 'BMH Jawa Timur', NULL, NULL, 'daerah'),

  -- BMH Jawa Barat (Ketua Daerah + Delegasi)
  ('Dewi Sartika', 'BMH Jawa Barat', 'Ketua Daerah', NULL, 'daerah'),
  ('Ridwan Kamil', 'BMH Jawa Barat', NULL, NULL, 'daerah'),
  ('Aisyah Putri', 'BMH Jawa Barat', NULL, NULL, 'daerah'),
  ('Fajar Nugroho', 'BMH Jawa Barat', NULL, NULL, 'daerah'),

  -- BMH Jawa Tengah
  ('Budi Santoso', 'BMH Jawa Tengah', 'Ketua Daerah', NULL, 'daerah'),
  ('Sri Wahyuni', 'BMH Jawa Tengah', NULL, NULL, 'daerah'),
  ('Agus Prasetyo', 'BMH Jawa Tengah', NULL, NULL, 'daerah'),
  ('Ratna Dewi', 'BMH Jawa Tengah', NULL, NULL, 'daerah'),

  -- BMH DKI Jakarta
  ('Siti Aminah', 'BMH DKI Jakarta', 'Ketua Daerah', NULL, 'daerah'),
  ('Reza Firmansyah', 'BMH DKI Jakarta', NULL, NULL, 'daerah'),
  ('Lestari Handayani', 'BMH DKI Jakarta', NULL, NULL, 'daerah'),
  ('Dian Purnama', 'BMH DKI Jakarta', NULL, NULL, 'daerah'),

  -- BMH DI Yogyakarta
  ('Wahyu Hidayat', 'BMH DI Yogyakarta', 'Ketua Daerah', NULL, 'daerah'),
  ('Fitri Rahmawati', 'BMH DI Yogyakarta', NULL, NULL, 'daerah'),
  ('Arif Wicaksono', 'BMH DI Yogyakarta', NULL, NULL, 'daerah'),
  ('Mega Safitri', 'BMH DI Yogyakarta', NULL, NULL, 'daerah'),

  -- BMH Sumatera Utara
  ('Rahmat Harahap', 'BMH Sumatera Utara', 'Ketua Daerah', NULL, 'daerah'),
  ('Sari Lubis', 'BMH Sumatera Utara', NULL, NULL, 'daerah'),
  ('Irfan Nasution', 'BMH Sumatera Utara', NULL, NULL, 'daerah'),
  ('Aminah Siregar', 'BMH Sumatera Utara', NULL, NULL, 'daerah')
ON CONFLICT (lower(trim(nama)), lower(trim(perwakilan_daerah))) DO UPDATE SET
  jabatan = EXCLUDED.jabatan,
  departemen = EXCLUDED.departemen,
  kategori = EXCLUDED.kategori;
