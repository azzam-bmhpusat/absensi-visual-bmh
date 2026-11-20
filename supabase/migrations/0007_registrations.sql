-- 0007_registrations.sql
-- Registrasi peserta Rakernas BMH 2027: formulir publik -> approval admin -> tabel guests.
-- Aman dijalankan berulang kali (idempotent). Tempel seluruhnya di Supabase SQL Editor.
begin;

-- 1. Kolom baru di guests (nullable agar data lama tetap valid)
alter table public.guests
  add column if not exists ukuran_baju text
    check (ukuran_baju is null or ukuran_baju in ('S', 'M', 'L', 'XL', 'XXL', '3XL')),
  add column if not exists mode_kehadiran text
    check (mode_kehadiran is null or mode_kehadiran in ('offline', 'online'));

-- 2. Tabel pendaftaran
create table if not exists public.registrations (
  id             uuid primary key default gen_random_uuid(),
  nama           text not null check (length(btrim(nama)) between 2 and 100),
  perwakilan_bmh text not null check (length(btrim(perwakilan_bmh)) between 2 and 100),
  jabatan        text not null check (length(btrim(jabatan)) between 2 and 100),
  departemen     text check (departemen is null or length(btrim(departemen)) between 1 and 100),
  ukuran_baju    text not null check (ukuran_baju in ('S', 'M', 'L', 'XL', 'XXL', '3XL')),
  mode_kehadiran text not null check (mode_kehadiran in ('offline', 'online')),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  guest_id       uuid references public.guests(id) on delete set null,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);

-- Cegah pendaftaran ganda (nama + perwakilan) selama belum ditolak
create unique index if not exists registrations_unique_person
  on public.registrations (lower(btrim(nama)), lower(btrim(perwakilan_bmh)))
  where status in ('pending', 'approved');

create index if not exists registrations_status_created
  on public.registrations (status, created_at desc);

-- 3. RLS: anon tidak punya akses sama sekali (data pribadi).
--    Peserta mengirim lewat Server Action (service role); admin = authenticated.
alter table public.registrations enable row level security;

revoke all on public.registrations from anon, authenticated;
grant select, update, delete on public.registrations to authenticated;

drop policy if exists "admin read registrations" on public.registrations;
create policy "admin read registrations" on public.registrations
  for select to authenticated using ((select auth.uid()) is not null);

drop policy if exists "admin update registrations" on public.registrations;
create policy "admin update registrations" on public.registrations
  for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "admin delete registrations" on public.registrations;
create policy "admin delete registrations" on public.registrations
  for delete to authenticated using ((select auth.uid()) is not null);

-- 4. Approval atomik: salin pendaftar ke guests lalu tandai approved.
create or replace function public.approve_registration(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.registrations%rowtype;
  v_guest_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  select * into r from public.registrations where id = p_id for update;
  if not found then
    raise exception 'Pendaftaran tidak ditemukan' using errcode = 'P0002';
  end if;

  if r.status = 'approved' and r.guest_id is not null then
    return r.guest_id;
  end if;

  insert into public.guests
    (nama, perwakilan_daerah, jabatan, departemen, kategori, ukuran_baju, mode_kehadiran)
  values
    (btrim(r.nama), btrim(r.perwakilan_bmh), r.jabatan, r.departemen, 'daerah',
     r.ukuran_baju, r.mode_kehadiran)
  on conflict (lower(trim(nama)), lower(trim(perwakilan_daerah)))
  do update set
    ukuran_baju    = excluded.ukuran_baju,
    mode_kehadiran = excluded.mode_kehadiran,
    jabatan        = coalesce(public.guests.jabatan, excluded.jabatan),
    departemen     = coalesce(public.guests.departemen, excluded.departemen)
  returning id into v_guest_id;

  update public.registrations
     set status = 'approved', guest_id = v_guest_id, reviewed_at = now()
   where id = p_id;

  return v_guest_id;
end;
$$;

revoke execute on function public.approve_registration(uuid) from public, anon;
grant execute on function public.approve_registration(uuid) to authenticated;

commit;
