-- Konten dinamis halaman /informasi-kamar-hotel dan 3 halaman /publikasi (sebelumnya lib/*-dummy.ts).
-- Baca: authenticated (halaman dibatasi ProfileGate; app membaca server-side dengan service role).
-- Tulis: hanya admin (public.is_admin()); app menulis lewat server action + service role.
-- Penghuni kamar = profiles ber-role 'peserta' (relasi, nama/wilayah tidak disalin).
begin;

create or replace function public.set_content_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Kamar hotel --------------------------------------------------------------
create table public.hotel_rooms (
  id bigint generated always as identity primary key,
  nomor text not null unique check (length(btrim(nomor)) between 1 and 20),
  lantai smallint not null check (lantai between 0 and 200),
  kapasitas smallint not null default 2 check (kapasitas between 1 and 6),
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hotel_room_occupants (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.hotel_rooms(id) on delete cascade,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index hotel_room_occupants_room_idx on public.hotel_room_occupants(room_id);

-- Hanya peserta; jumlah penghuni <= kapasitas kamar.
create or replace function public.check_hotel_room_occupant()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_role public.app_role;
  v_kapasitas smallint;
  v_jumlah int;
begin
  select role into v_role from public.profiles where id = new.profile_id;
  if v_role is distinct from 'peserta' then
    raise exception 'Penghuni kamar harus ber-role peserta' using errcode = '23514';
  end if;
  select kapasitas into v_kapasitas from public.hotel_rooms where id = new.room_id for update;
  select count(*) into v_jumlah from public.hotel_room_occupants
    where room_id = new.room_id and id is distinct from new.id;
  if v_jumlah >= v_kapasitas then
    raise exception 'Kamar sudah penuh (kapasitas %)', v_kapasitas using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger hotel_room_occupants_check before insert or update on public.hotel_room_occupants
for each row execute function public.check_hotel_room_occupant();

-- Kapasitas tidak boleh diturunkan di bawah jumlah penghuni.
create or replace function public.check_hotel_room_capacity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.kapasitas < (select count(*) from public.hotel_room_occupants where room_id = new.id) then
    raise exception 'Kapasitas lebih kecil dari jumlah penghuni' using errcode = '23514';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger hotel_rooms_capacity before update on public.hotel_rooms
for each row execute function public.check_hotel_room_capacity();

create table public.hotel_info_items (
  id bigint generated always as identity primary key,
  judul text not null check (length(btrim(judul)) between 1 and 200),
  isi text not null check (length(btrim(isi)) between 1 and 2000),
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hotel_contact (
  id smallint primary key default 1 check (id = 1),
  nama text not null check (length(btrim(nama)) between 1 and 100),
  whatsapp text not null check (whatsapp ~ '^[0-9]{8,16}$'),
  updated_at timestamptz not null default now()
);

-- Publikasi ---------------------------------------------------------------
create table public.gallery_albums (
  id bigint generated always as identity primary key,
  judul text not null check (length(btrim(judul)) between 1 and 200),
  tanggal date not null,
  lokasi text not null check (length(btrim(lokasi)) between 1 and 200),
  jumlah_foto int not null default 0 check (jumlah_foto between 0 and 100000),
  cover_path text not null,
  deskripsi text not null default '' check (length(deskripsi) <= 2000),
  drive_url text not null check (drive_url ~ '^https://[^/[:space:]]+'),
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.presentation_materials (
  id bigint generated always as identity primary key,
  judul text not null check (length(btrim(judul)) between 1 and 200),
  pemateri text not null check (length(btrim(pemateri)) between 1 and 200),
  jabatan text not null default '' check (length(jabatan) <= 200),
  sesi text not null check (length(btrim(sesi)) between 1 and 100),
  tanggal date not null,
  format text not null check (format in ('PDF', 'PPTX')),
  ukuran text not null default '' check (length(ukuran) <= 20),
  deskripsi text not null default '' check (length(deskripsi) <= 2000),
  drive_url text not null check (drive_url ~ '^https://[^/[:space:]]+'),
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meeting_minutes (
  id bigint generated always as identity primary key,
  judul text not null check (length(btrim(judul)) between 1 and 200),
  tanggal date not null,
  waktu text not null check (length(btrim(waktu)) between 1 and 50),
  tempat text not null check (length(btrim(tempat)) between 1 and 200),
  pimpinan text not null check (length(btrim(pimpinan)) between 1 and 200),
  notulis text not null check (length(btrim(notulis)) between 1 and 200),
  jumlah_peserta int not null default 0 check (jumlah_peserta between 0 and 100000),
  keputusan text[] not null default '{}',
  status text not null default 'Draf' check (status in ('Final', 'Draf')),
  drive_url text not null check (drive_url ~ '^https://[^/[:space:]]+'),
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hotel_info_items_updated_at before update on public.hotel_info_items
for each row execute function public.set_content_updated_at();
create trigger hotel_contact_updated_at before update on public.hotel_contact
for each row execute function public.set_content_updated_at();
create trigger gallery_albums_updated_at before update on public.gallery_albums
for each row execute function public.set_content_updated_at();
create trigger presentation_materials_updated_at before update on public.presentation_materials
for each row execute function public.set_content_updated_at();
create trigger meeting_minutes_updated_at before update on public.meeting_minutes
for each row execute function public.set_content_updated_at();

-- RLS ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['hotel_rooms','hotel_room_occupants','hotel_info_items','hotel_contact',
                           'gallery_albums','presentation_materials','meeting_minutes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "authenticated read %s" on public.%I for select to authenticated using (true)', t, t);
    execute format('create policy "admin write %s" on public.%I for all to authenticated
                    using ((select public.is_admin())) with check ((select public.is_admin()))', t, t);
  end loop;
end $$;

revoke execute on function public.check_hotel_room_occupant() from public, anon, authenticated;
revoke execute on function public.check_hotel_room_capacity() from public, anon, authenticated;
revoke execute on function public.set_content_updated_at() from public, anon, authenticated;

-- Storage: cover album galeri (upload hanya lewat server action service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('konten', 'konten', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
