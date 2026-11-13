-- Tambah sesi Hari Ketiga ke tabel public.sessions
INSERT INTO public.sessions (id, slug, nama, is_active)
VALUES (3, 'hari-3', 'Hari Ketiga', true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  nama = EXCLUDED.nama,
  is_active = EXCLUDED.is_active;
