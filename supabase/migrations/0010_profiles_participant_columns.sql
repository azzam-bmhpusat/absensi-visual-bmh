-- Kolom peserta (bekas tabel guests) pada profiles. JALANKAN SETELAH 0008 & 0009.
-- Tahap 1 dari 2: menambah kolom + akses publik terbatas. Data dipindahkan dengan
-- `npx tsx scripts/migrate-guests-to-profiles.ts --apply`; tabel guests baru dihapus di 0011.
begin;

alter table public.profiles
  add column if not exists nama text,
  add column if not exists perwakilan_daerah text,
  add column if not exists jabatan text,
  add column if not exists departemen text,
  add column if not exists kategori text,
  add column if not exists ukuran_baju text
    check (ukuran_baju is null or ukuran_baju in ('S', 'M', 'L', 'XL', 'XXL', '3XL')),
  add column if not exists mode_kehadiran text
    check (mode_kehadiran is null or mode_kehadiran in ('offline', 'online')),
  -- id baris lama di tabel guests; dipakai 0011 untuk menyambungkan riwayat kehadiran & registrasi.
  add column if not exists legacy_guest_id uuid;

create unique index if not exists profiles_legacy_guest_id_key
  on public.profiles (legacy_guest_id) where legacy_guest_id is not null;

-- Satu orang (nama + perwakilan) hanya satu profil peserta (setara guests_unique_person).
create unique index if not exists profiles_unique_participant
  on public.profiles (lower(btrim(nama)), lower(btrim(perwakilan_daerah)))
  where nama is not null;

create index if not exists profiles_kategori on public.profiles (kategori) where nama is not null;
create index if not exists profiles_departemen on public.profiles (departemen) where departemen is not null;

-- Halaman publik (/absen, videotron, beranda) membaca peserta sebagai anon (juga saat peserta/admin sedang login).
-- Hanya KOLOM peserta yang dibuka untuk klien; email dan role tidak terbaca lewat API oleh siapa pun
-- (pengecekan admin memakai public.is_admin(); pengelolaan akun memakai service role di server).
revoke select on public.profiles from authenticated;
grant select (id, nama, perwakilan_daerah, jabatan, departemen, kategori, ukuran_baju, mode_kehadiran, created_at)
  on public.profiles to anon, authenticated;

drop policy if exists "Public can read participants" on public.profiles;
create policy "Public can read participants" on public.profiles
  for select to anon, authenticated using (nama is not null);

commit;
