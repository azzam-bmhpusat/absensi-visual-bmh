-- Kontak & rencana kedatangan peserta pada profiles. JALANKAN SETELAH 0010 & 0011.
-- Kolom ini PRIVAT: tidak di-grant ke anon/authenticated (0010 hanya membuka kolom peserta publik).
-- Dibaca dan ditulis di server (service role) untuk akun yang sedang login (halaman /profile).
begin;

alter table public.profiles
  add column if not exists no_whatsapp text
    check (no_whatsapp is null or no_whatsapp ~ '^\+?[0-9]{8,15}$'),
  add column if not exists rencana_kedatangan timestamptz;

commit;
