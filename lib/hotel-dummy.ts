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
      { nama: "Peserta 1", wilayah: "Jawa Barat" },
      { nama: "Peserta 2", wilayah: "DKI Jakarta" },
    ],
  },
  {
    nomor: "302",
    lantai: 3,
    penghuni: [
      { nama: "Peserta 3", wilayah: "Jawa Timur" },
      { nama: "Peserta 4", wilayah: "Banten" },
    ],
  },
  {
    nomor: "303",
    lantai: 3,
    penghuni: [
      { nama: "Peserta 5", wilayah: "Jawa Tengah" },
      { nama: "Peserta 6", wilayah: "DI Yogyakarta" },
    ],
  },
  {
    nomor: "401",
    lantai: 4,
    penghuni: [
      { nama: "Peserta 7", wilayah: "Sumatera Utara" },
      { nama: "Peserta 8", wilayah: "Sumatera Barat" },
    ],
  },
  {
    nomor: "402",
    lantai: 4,
    penghuni: [
      { nama: "Peserta 9", wilayah: "Riau" },
      { nama: "Peserta 10", wilayah: "Lampung" },
    ],
  },
  {
    nomor: "403",
    lantai: 4,
    penghuni: [{ nama: "Peserta 11", wilayah: "Aceh" }],
  },
  {
    nomor: "501",
    lantai: 5,
    penghuni: [
      { nama: "Peserta 12", wilayah: "Kalimantan Timur" },
      { nama: "Peserta 13", wilayah: "Kalimantan Selatan" },
    ],
  },
  {
    nomor: "502",
    lantai: 5,
    penghuni: [
      { nama: "Peserta 14", wilayah: "Sulawesi Selatan" },
      { nama: "Peserta 15", wilayah: "Bali" },
    ],
  },
  {
    nomor: "503",
    lantai: 5,
    penghuni: [
      { nama: "Peserta 16", wilayah: "Nusa Tenggara Barat" },
      { nama: "Peserta 17", wilayah: "Papua" },
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
