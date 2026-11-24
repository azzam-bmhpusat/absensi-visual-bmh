// Data dummy sementara untuk halaman /informasi-kamar-hotel.
// Ganti dengan data dari database saat fitur penempatan kamar siap.

export type Penghuni = { nama: string; wilayah: string };

export type Kamar = {
  nomor: string;
  lantai: number;
  penghuni: Penghuni[];
};

export const DAFTAR_KAMAR: Kamar[] = [
  {
    nomor: "301",
    lantai: 3,
    penghuni: [
      { nama: "Ahmad Hidayat", wilayah: "Jawa Barat" },
      { nama: "Budi Santoso", wilayah: "DKI Jakarta" },
    ],
  },
  {
    nomor: "302",
    lantai: 3,
    penghuni: [
      { nama: "Choirul Anam", wilayah: "Jawa Timur" },
      { nama: "Dedi Kurniawan", wilayah: "Banten" },
    ],
  },
  {
    nomor: "303",
    lantai: 3,
    penghuni: [
      { nama: "Eko Prasetyo", wilayah: "Jawa Tengah" },
      { nama: "Fajar Ramadhan", wilayah: "DI Yogyakarta" },
    ],
  },
  {
    nomor: "401",
    lantai: 4,
    penghuni: [
      { nama: "Gilang Saputra", wilayah: "Sumatera Utara" },
      { nama: "Hasan Basri", wilayah: "Sumatera Barat" },
    ],
  },
  {
    nomor: "402",
    lantai: 4,
    penghuni: [
      { nama: "Irfan Maulana", wilayah: "Riau" },
      { nama: "Joko Widodo", wilayah: "Lampung" },
    ],
  },
  {
    nomor: "403",
    lantai: 4,
    penghuni: [{ nama: "Khairul Umam", wilayah: "Aceh" }],
  },
  {
    nomor: "501",
    lantai: 5,
    penghuni: [
      { nama: "Lukman Hakim", wilayah: "Kalimantan Timur" },
      { nama: "Muhammad Rizki", wilayah: "Kalimantan Selatan" },
    ],
  },
  {
    nomor: "502",
    lantai: 5,
    penghuni: [
      { nama: "Nur Hidayat", wilayah: "Sulawesi Selatan" },
      { nama: "Oki Setiawan", wilayah: "Bali" },
    ],
  },
  {
    nomor: "503",
    lantai: 5,
    penghuni: [
      { nama: "Putra Pratama", wilayah: "Nusa Tenggara Barat" },
      { nama: "Rahmat Hidayat", wilayah: "Papua" },
    ],
  },
];

export const INFO_PENTING: { judul: string; isi: string }[] = [
  {
    judul: "Proses check-in",
    isi: "Tunjukkan KTP dan sebutkan nama sebagai peserta Rakernas BMH di meja resepsionis. Kunci kamar diambil oleh peserta yang tiba lebih dulu.",
  },
  {
    judul: "Sarapan",
    isi: "Sarapan tersedia pukul 05.30–09.00 WIB di restoran lantai dasar. Acara pagi dimulai pukul 07.30 WIB.",
  },
  {
    judul: "Tagihan tambahan",
    isi: "Panitia menanggung biaya kamar dan sarapan. Minibar, laundry, dan layanan kamar menjadi tanggungan pribadi dan dibayar saat check-out.",
  },
  {
    judul: "Perubahan kamar",
    isi: "Permintaan pindah kamar atau teman sekamar disampaikan ke panitia akomodasi, bukan langsung ke hotel.",
  },
];

export const KONTAK_PANITIA = { nama: "Panitia Akomodasi", whatsapp: "6281200000000" };
