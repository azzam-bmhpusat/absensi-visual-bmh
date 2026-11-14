-- 0004_add_guest_roles_and_departments.sql
-- Menambahkan kolom jabatan, departemen, dan kategori ke tabel guests dan attendances

-- 1. Tambah kolom ke tabel public.guests
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS jabatan TEXT,
  ADD COLUMN IF NOT EXISTS departemen TEXT,
  ADD COLUMN IF NOT EXISTS kategori TEXT NOT NULL DEFAULT 'daerah';

-- 2. Tambah kolom ke tabel public.attendances
ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS jabatan TEXT,
  ADD COLUMN IF NOT EXISTS departemen TEXT,
  ADD COLUMN IF NOT EXISTS kategori TEXT NOT NULL DEFAULT 'daerah';

-- 3. Indeks pendukung untuk filter kategori dan departemen
CREATE INDEX IF NOT EXISTS idx_guests_kategori ON public.guests (kategori);
CREATE INDEX IF NOT EXISTS idx_guests_departemen ON public.guests (departemen) WHERE departemen IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendances_kategori ON public.attendances (kategori);
