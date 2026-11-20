-- Hapus tabel guests. Tahap 2 dari 2. TIDAK DAPAT DIBATALKAN setelah commit.
-- Prasyarat (urut): 0010 sudah dijalankan -> skrip migrate-guests-to-profiles --apply sudah dijalankan ->
-- aplikasi versi baru (membaca profiles) sudah berjalan -> cadangan attendances/registrations sudah diekspor.
-- Bila ada guests yang belum dipindahkan, migrasi ini berhenti dan tidak mengubah apa pun.
begin;

do $$
declare
  missing integer;
begin
  select count(*) into missing
  from public.guests g
  where not exists (select 1 from public.profiles p where p.legacy_guest_id = g.id);
  if missing > 0 then
    raise exception 'Masih ada % baris guests yang belum dipindahkan ke profiles. Jalankan skrip migrasi --apply dulu.', missing;
  end if;
end $$;

-- Lepas FK lama, arahkan riwayat ke id profil baru, lalu pasang FK baru ke profiles.
alter table public.attendances  drop constraint if exists attendances_guest_id_fkey;
alter table public.registrations drop constraint if exists registrations_guest_id_fkey;

update public.attendances a
   set guest_id = p.id
  from public.profiles p
 where p.legacy_guest_id = a.guest_id;

update public.registrations r
   set guest_id = p.id
  from public.profiles p
 where p.legacy_guest_id = r.guest_id;

-- Baris yang tidak punya pasangan (mis. guest sudah terhapus sebelumnya) dikosongkan agar FK valid.
update public.attendances a set guest_id = null
 where guest_id is not null and not exists (select 1 from public.profiles p where p.id = a.guest_id);
update public.registrations r set guest_id = null
 where guest_id is not null and not exists (select 1 from public.profiles p where p.id = r.guest_id);

alter table public.attendances
  add constraint attendances_guest_id_fkey
  foreign key (guest_id) references public.profiles (id) on delete set null;
alter table public.registrations
  add constraint registrations_guest_id_fkey
  foreign key (guest_id) references public.profiles (id) on delete set null;

-- Approval kini dilakukan oleh aplikasi (membuat akun Auth + profil), bukan fungsi SQL.
drop function if exists public.approve_registration(uuid);

drop table public.guests cascade;

commit;
