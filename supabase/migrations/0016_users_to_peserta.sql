-- Semua akun ber-role 'user' dipindah ke 'peserta', dan akun baru kini default 'peserta'.
-- Nilai 'user' tetap ada di enum (masih bisa dipilih admin). Jalankan setelah 0015.
begin;

update public.profiles set role = 'peserta' where role = 'user';

alter table public.profiles alter column role set default 'peserta';

commit;

-- Rollback (bila perlu):
--   alter table public.profiles alter column role set default 'user';
--   update public.profiles set role = 'user' where role = 'peserta';
-- Verifikasi:
--   select role, count(*) from public.profiles group by role;
