-- Profil pengguna (role admin/user) yang otomatis mengikuti akun Supabase Auth.
-- Akun yang sudah ada saat migrasi ini dijalankan dijadikan admin; akun baru default 'user'.
-- Catatan: migrasi ini belum mengubah pembatasan akses admin di middleware/RLS tabel lain.
begin;

create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Akun yang sudah terdaftar -> admin.
insert into public.profiles (id, email, role)
select id, email, 'admin'::public.app_role
from auth.users;

-- Akun baru di Supabase Auth -> otomatis masuk profiles (role default 'user').
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Email diganti di Supabase Auth -> profiles ikut diperbarui.
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_user_email_change();

create function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- Helper untuk policy (security definer agar tidak rekursif terhadap RLS profiles).
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Fungsi trigger tidak boleh dipanggil langsung lewat API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.set_profiles_updated_at() from public, anon, authenticated;

-- RLS: klien hanya boleh membaca. Role hanya diubah lewat SQL Editor / service role.
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "Users can read own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy "Admins can read all profiles" on public.profiles
for select to authenticated using (public.is_admin());

commit;

-- Mengubah role (jalankan manual di SQL Editor):
--   update public.profiles set role = 'admin' where email = 'panitia@bmh.or.id';
--   update public.profiles set role = 'user'  where email = 'contoh@bmh.or.id';
-- Verifikasi:
--   select email, role from public.profiles order by created_at;
