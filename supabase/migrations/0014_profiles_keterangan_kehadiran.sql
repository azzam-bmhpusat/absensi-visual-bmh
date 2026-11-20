-- Keterangan kehadiran peserta (online / offline). JALANKAN SETELAH 0012.
-- Kolom PRIVAT seperti 0012: tidak di-grant ke anon/authenticated; dibaca/ditulis via service role.
begin;

alter table public.profiles
  add column if not exists keterangan_kehadiran text
    check (keterangan_kehadiran is null or keterangan_kehadiran in ('online', 'offline'));

commit;
