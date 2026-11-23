-- Foto profil: kolom profiles.avatar_url + bucket Storage publik 'avatars'.
-- Objek disimpan di '{user_id}/avatar'. avatar_url diisi trigger dari storage.objects
-- (path + '?v=<epoch>' untuk cache-busting), jadi upload/hapus dari app maupun dashboard
-- Supabase langsung tersinkron. URL publik dirakit app dari NEXT_PUBLIC_SUPABASE_URL.
-- Upload hanya lewat server action (service role): tidak ada policy tulis untuk klien.
begin;

alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.sync_profile_avatar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  obj record;
  owner_id text;
begin
  obj := case when tg_op = 'DELETE' then old else new end;
  if obj.bucket_id <> 'avatars' then
    return null;
  end if;

  owner_id := (storage.foldername(obj.name))[1];
  if owner_id is null
     or owner_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;

  if tg_op = 'DELETE' then
    update public.profiles set avatar_url = null
    where id = owner_id::uuid and split_part(avatar_url, '?', 1) = obj.name;
  else
    update public.profiles
    set avatar_url = obj.name || '?v=' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint
    where id = owner_id::uuid;
  end if;
  return null;
end;
$$;

revoke execute on function public.sync_profile_avatar() from public, anon, authenticated;

drop trigger if exists on_avatar_object_change on storage.objects;
create trigger on_avatar_object_change
after insert or update or delete on storage.objects
for each row execute function public.sync_profile_avatar();

commit;

-- Rollback (bila perlu):
--   drop trigger if exists on_avatar_object_change on storage.objects;
--   drop function if exists public.sync_profile_avatar();
--   alter table public.profiles drop column if exists avatar_url;
--   -- kosongkan bucket lewat dashboard Storage, lalu: delete from storage.buckets where id = 'avatars';
-- Verifikasi:
--   select id, public, file_size_limit from storage.buckets where id = 'avatars';
--   select id, avatar_url from public.profiles where avatar_url is not null;
