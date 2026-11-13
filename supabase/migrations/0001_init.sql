create extension if not exists "pgcrypto";

-- Sesi acara (2 baris tetap)
create table public.sessions (
  id        smallint primary key,
  slug      text unique not null,
  nama      text not null,
  tanggal   date,
  is_active boolean not null default true
);

insert into public.sessions (id, slug, nama) values
  (1, 'hari-1', 'Hari Pertama'),
  (2, 'hari-2', 'Hari Kedua');

-- Daftar tamu undangan
create table public.guests (
  id                uuid primary key default gen_random_uuid(),
  nama              text not null,
  perwakilan_daerah text not null,
  created_at        timestamptz not null default now()
);
create unique index guests_unique_person
  on public.guests (lower(trim(nama)), lower(trim(perwakilan_daerah)));

-- Catatan kehadiran
create table public.attendances (
  id                uuid primary key default gen_random_uuid(),
  session_id        smallint not null references public.sessions(id),
  guest_id          uuid references public.guests(id) on delete set null,
  nama              text not null,
  perwakilan_daerah text not null,
  is_walk_in        boolean not null default false,
  checked_in_at     timestamptz not null default now()
);
create unique index attendances_unique_person
  on public.attendances (session_id, lower(trim(nama)), lower(trim(perwakilan_daerah)));
create unique index attendances_unique_guest
  on public.attendances (session_id, guest_id) where guest_id is not null;
create index attendances_session_time
  on public.attendances (session_id, checked_in_at desc);

-- Realtime
alter publication supabase_realtime add table public.attendances;

-- RLS
alter table public.sessions    enable row level security;
alter table public.guests      enable row level security;
alter table public.attendances enable row level security;

create policy "read sessions"    on public.sessions    for select to anon, authenticated using (true);
create policy "read guests"      on public.guests      for select to anon, authenticated using (true);
create policy "read attendances" on public.attendances for select to anon, authenticated using (true);

-- Tulis hanya untuk admin (authenticated). Peserta menulis lewat Server Action (service role).
create policy "admin write guests"      on public.guests      for all to authenticated using (true) with check (true);
create policy "admin write attendances" on public.attendances for all to authenticated using (true) with check (true);
create policy "admin write sessions"    on public.sessions    for all to authenticated using (true) with check (true);
