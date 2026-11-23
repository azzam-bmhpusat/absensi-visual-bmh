-- Role baru 'peserta' pada enum public.app_role. Role lama 'user' TIDAK dihapus.
-- Dipisah dari 0016: nilai enum baru belum boleh dipakai di transaksi yang sama dengan penambahannya.
alter type public.app_role add value if not exists 'peserta';
