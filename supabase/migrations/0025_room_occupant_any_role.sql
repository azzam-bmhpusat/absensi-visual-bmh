-- Penghuni kamar boleh semua role kecuali 'user' (sebelumnya hanya 'peserta').
create or replace function public.check_hotel_room_occupant()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_role public.app_role;
  v_kapasitas smallint;
  v_jumlah int;
begin
  select role into v_role from public.profiles where id = new.profile_id;
  if v_role is null or v_role = 'user' then
    raise exception 'Penghuni kamar tidak boleh ber-role user' using errcode = '23514';
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
