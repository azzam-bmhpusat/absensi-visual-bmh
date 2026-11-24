-- Login dengan Google: akun BARU dari Google mendapat role 'user' dan nama dari Google disimpan
-- di kolom privat nama_google. Jalankan setelah 0016.
--
-- Nama Google sengaja TIDAK diisi ke kolom nama: profil dengan nama terisi tampil publik sebagai
-- peserta (policy "Public can read participants" di 0010). nama_google PRIVAT seperti 0012/0014:
-- tidak di-grant ke anon/authenticated; dibaca server lewat service role.
-- Akun lama yang login dengan Google (email sama, identitas ditautkan otomatis oleh Supabase)
-- tidak membuat baris auth.users baru, sehingga trigger ini tidak berjalan dan role-nya tetap.
begin;

alter table public.profiles add column if not exists nama_google text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ->> 'provider' = 'google' then
    insert into public.profiles (id, email, role, nama_google)
    values (
      new.id,
      new.email,
      'user',
      nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), '')
    )
    on conflict (id) do nothing;
  else
    -- Role mengikuti default kolom ('peserta', 0016).
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

-- Fungsi trigger tidak boleh dipanggil langsung lewat API (create or replace mempertahankan grant lama).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

commit;

-- Rollback (bila perlu): kembalikan handle_new_user ke versi 0008, lalu
--   alter table public.profiles drop column if exists nama_google;
-- Verifikasi setelah login Google pertama:
--   select email, role, nama, nama_google from public.profiles where nama_google is not null;
