-- Role baru 'pengurus': hak akses sama dengan 'direktur' (semua halaman situs tanpa syarat profil,
-- tanpa dashboard admin). is_admin() tetap hanya menerima 'admin', jadi rute admin otomatis tertolak.
alter type public.app_role add value if not exists 'pengurus';
