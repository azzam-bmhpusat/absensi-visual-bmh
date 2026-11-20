-- Hak tulis/ubah data admin kini mensyaratkan role 'admin' (public.is_admin() dari 0008),
-- bukan sekadar "sudah login". JALANKAN SETELAH 0008_profiles.sql.
-- Bila fungsi public.is_admin() belum ada, migrasi ini gagal (aman: tidak ada yang berubah).
begin;

-- sessions, guests, attendances (0001)
drop policy if exists "admin write guests" on public.guests;
create policy "admin write guests" on public.guests
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "admin write attendances" on public.attendances;
create policy "admin write attendances" on public.attendances
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "admin write sessions" on public.sessions;
create policy "admin write sessions" on public.sessions
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- event_settings (0005)
drop policy if exists "Admins can update event settings" on public.event_settings;
create policy "Admins can update event settings" on public.event_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- registrations (0007)
drop policy if exists "admin read registrations" on public.registrations;
create policy "admin read registrations" on public.registrations
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "admin update registrations" on public.registrations;
create policy "admin update registrations" on public.registrations
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "admin delete registrations" on public.registrations;
create policy "admin delete registrations" on public.registrations
  for delete to authenticated using ((select public.is_admin()));

-- Approval atomik (salinan 0007; hanya pengecekan awal yang diganti menjadi is_admin()).
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
  if not (select public.is_admin()) then
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

-- Pemulihan bila ada admin yang terkunci (jalankan manual di SQL Editor):
--   update public.profiles set role = 'admin' where email = 'panitia@bmh.or.id';
