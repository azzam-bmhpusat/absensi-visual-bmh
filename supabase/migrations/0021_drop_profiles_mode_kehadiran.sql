-- Kolom lama mode_kehadiran pada profiles digantikan keterangan_kehadiran (0014); dihapus.
-- Grant kolom ikut hilang.
alter table public.profiles drop column if exists mode_kehadiran;
