-- Role baru 'direktur': akses semua halaman situs (termasuk halaman peserta) tanpa akses dashboard admin.
-- is_admin() tetap hanya menerima 'admin', jadi rute admin otomatis tertolak.
alter type public.app_role add value if not exists 'direktur';
