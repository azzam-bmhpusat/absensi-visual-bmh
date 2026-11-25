-- Kolom departemen tidak pernah terisi (profiles & attendances); dihapus. Grant kolom ikut hilang.
drop index if exists public.profiles_departemen;
alter table public.profiles drop column if exists departemen;
alter table public.attendances drop column if exists departemen;
