-- Singleton public event content. Attendance sessions remain independently managed.
begin;

create table public.event_settings (
  id smallint primary key default 1 check (id = 1),
  venue_name text not null check (length(btrim(venue_name)) between 1 and 200),
  venue_address text not null check (length(btrim(venue_address)) between 1 and 1000),
  maps_url text not null check (maps_url ~ '^https://[^/[:space:]]+'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  starts_at timestamptz not null check (isfinite(starts_at)),
  ends_at timestamptz check (ends_at is null or (
    isfinite(ends_at) and ends_at > starts_at and
    (ends_at at time zone 'Asia/Jakarta')::date = (starts_at at time zone 'Asia/Jakarta')::date + 2
  )),
  footer_url text not null check (footer_url ~ '^https://[^/[:space:]]+'),
  updated_at timestamptz not null default now()
);

insert into public.event_settings
  (id, venue_name, venue_address, maps_url, latitude, longitude, starts_at, ends_at, footer_url)
values (
  1, 'Hotel Luminor',
  'Jl. Raya Mangga Besar No.73 1, RT.1/RW.2, Tangki, Kec. Taman Sari, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11170',
  'https://maps.app.goo.gl/d4RQdTwK9jbx4qZD8', -6.148531, 106.823191,
  '2026-12-01T10:00:00+07:00', null, 'https://wa.me/6289517795206'
);

create function public.set_event_settings_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger event_settings_updated_at before update on public.event_settings
for each row execute function public.set_event_settings_updated_at();

alter table public.event_settings enable row level security;
grant select on public.event_settings to anon, authenticated;
grant update on public.event_settings to authenticated;
revoke insert, delete, truncate on public.event_settings from anon, authenticated;

create policy "Public can read event settings" on public.event_settings
for select to anon, authenticated using (true);
-- This project treats authenticated accounts as admins, matching its existing policies.
create policy "Admins can update event settings" on public.event_settings
for update to authenticated using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

commit;
