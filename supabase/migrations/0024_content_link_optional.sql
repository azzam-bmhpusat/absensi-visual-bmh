-- Link tombol card Publikasi (drive_url) boleh kosong: tombol di halaman publik nonaktif bila null.
-- Placeholder seed 'https://drive.google.com/' dikosongkan.
do $$
declare t text; c text;
begin
  foreach t in array array['gallery_albums','presentation_materials','meeting_minutes'] loop
    for c in select conname from pg_constraint
             where conrelid = format('public.%I', t)::regclass and contype = 'c'
               and pg_get_constraintdef(oid) like '%drive_url%' loop
      execute format('alter table public.%I drop constraint %I', t, c);
    end loop;
    execute format('alter table public.%I alter column drive_url drop not null', t);
    execute format('alter table public.%I add constraint %I check (drive_url is null or drive_url ~ ''^https://[^/[:space:]]+'')', t, t || '_drive_url_check');
    execute format('update public.%I set drive_url = null where drive_url in (''https://drive.google.com/'', ''https://drive.google.com'')', t);
  end loop;
end $$;
