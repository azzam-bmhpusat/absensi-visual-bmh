-- Kolom departemen pada profiles tidak pernah terisi; dihapus. Grant kolom ikut hilang.
-- attendances.departemen dibiarkan (tidak lagi dibaca/ditulis kode).
drop index if exists public.profiles_departemen;
alter table public.profiles drop column if exists departemen;
