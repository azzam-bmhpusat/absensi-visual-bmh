-- Tambah kolom hari ke tabel sessions untuk mengelompokkan per hari
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS hari smallint NOT NULL DEFAULT 1;

-- Update / insert 9 sesi (3 sesi per hari × 3 hari)
INSERT INTO public.sessions (id, slug, nama, hari, is_active) VALUES
  (1, 'hari-1-pagi',   'Absen Masuk Pagi',            1, true),
  (2, 'hari-1-isoma',  'Masuk Setelah Isoma',         1, true),
  (3, 'hari-1-malam',  'Masuk Setelah Makan Malam',   1, true),
  (4, 'hari-2-pagi',   'Absen Masuk Pagi',            2, true),
  (5, 'hari-2-isoma',  'Masuk Setelah Isoma',         2, true),
  (6, 'hari-2-malam',  'Masuk Setelah Makan Malam',   2, true),
  (7, 'hari-3-pagi',   'Absen Masuk Pagi',            3, true),
  (8, 'hari-3-isoma',  'Masuk Setelah Isoma',         3, true),
  (9, 'hari-3-malam',  'Masuk Setelah Makan Malam',   3, true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  nama = EXCLUDED.nama,
  hari = EXCLUDED.hari,
  is_active = EXCLUDED.is_active;