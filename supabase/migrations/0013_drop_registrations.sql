-- Hapus tabel registrations (alur registrasi publik + approval sudah dihapus dari aplikasi).
-- TIDAK DAPAT DIBATALKAN. Cadangan: docs/backup/attendances_registrations_20261120.json.
-- Policy, index, dan FK tabel ikut terhapus; fungsi approve_registration sudah dihapus di 0011.
begin;

drop table if exists public.registrations cascade;

commit;
