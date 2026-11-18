-- Pengaman alur absen via QR dinamis:
-- ticket_nonce : satu tiket scan QR hanya bisa dipakai untuk satu absen.
-- device_hash  : satu HP hanya bisa mengabsen satu orang per sesi.
-- Keduanya nullable agar data lama dan input manual admin tetap valid.

alter table public.attendances
  add column if not exists ticket_nonce uuid,
  add column if not exists device_hash text;

create unique index if not exists attendances_unique_ticket
  on public.attendances (ticket_nonce)
  where ticket_nonce is not null;

create unique index if not exists attendances_unique_device
  on public.attendances (session_id, device_hash)
  where device_hash is not null;
