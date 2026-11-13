-- Seed data: 25 tamu dummy dengan 6 perwakilan daerah BMH
-- Gunakan ON CONFLICT DO NOTHING agar idempoten (bisa dijalankan berulang)

INSERT INTO public.guests (nama, perwakilan_daerah) VALUES
  -- BMH Jawa Timur (5 tamu)
  ('Ahmad Fauzi', 'BMH Jawa Timur'),
  ('Siti Khadijah', 'BMH Jawa Timur'),
  ('Muhammad Rizki', 'BMH Jawa Timur'),
  ('Nur Hidayah', 'BMH Jawa Timur'),
  ('Hasan Basri', 'BMH Jawa Timur'),

  -- BMH Jawa Barat (4 tamu)
  ('Dewi Sartika', 'BMH Jawa Barat'),
  ('Ridwan Kamil', 'BMH Jawa Barat'),
  ('Aisyah Putri', 'BMH Jawa Barat'),
  ('Fajar Nugroho', 'BMH Jawa Barat'),

  -- BMH Jawa Tengah (4 tamu)
  ('Budi Santoso', 'BMH Jawa Tengah'),
  ('Sri Wahyuni', 'BMH Jawa Tengah'),
  ('Agus Prasetyo', 'BMH Jawa Tengah'),
  ('Ratna Dewi', 'BMH Jawa Tengah'),

  -- BMH DKI Jakarta (4 tamu)
  ('Siti Aminah', 'BMH DKI Jakarta'),
  ('Reza Firmansyah', 'BMH DKI Jakarta'),
  ('Lestari Handayani', 'BMH DKI Jakarta'),
  ('Dian Purnama', 'BMH DKI Jakarta'),

  -- BMH DI Yogyakarta (4 tamu)
  ('Wahyu Hidayat', 'BMH DI Yogyakarta'),
  ('Fitri Rahmawati', 'BMH DI Yogyakarta'),
  ('Arif Wicaksono', 'BMH DI Yogyakarta'),
  ('Mega Safitri', 'BMH DI Yogyakarta'),

  -- BMH Sumatera Utara (4 tamu)
  ('Rahmat Harahap', 'BMH Sumatera Utara'),
  ('Sari Lubis', 'BMH Sumatera Utara'),
  ('Irfan Nasution', 'BMH Sumatera Utara'),
  ('Aminah Siregar', 'BMH Sumatera Utara')
ON CONFLICT DO NOTHING;
