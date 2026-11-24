export type AlbumKegiatan = {
  judul: string;
  tanggal: string;
  lokasi: string;
  jumlahFoto: number;
  cover: string;
  deskripsi: string;
  /** Link folder Google Drive album; isi nanti setelah foto diunggah. */
  driveUrl: string;
};

/** Data dummy album foto kegiatan Rakernas (sementara, sebelum foto asli diunggah). */
export const ALBUM_KEGIATAN: AlbumKegiatan[] = [
  {
    judul: "Pembukaan Rakernas",
    tanggal: "Senin, 15 Februari 2027",
    lokasi: "Ballroom Utama",
    jumlahFoto: 48,
    cover: "/galeri-fasilitas-hotel/ruang-acara.jpg",
    deskripsi: "Seremoni pembukaan, sambutan pimpinan, dan doa bersama seluruh peserta.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Sidang Pleno",
    tanggal: "Senin, 15 Februari 2027",
    lokasi: "Ballroom Utama",
    jumlahFoto: 36,
    cover: "/galeri-fasilitas-hotel/gedung.jpg",
    deskripsi: "Pemaparan evaluasi program dan arah kebijakan BMH tahun berjalan.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Sidang Komisi",
    tanggal: "Selasa, 16 Februari 2027",
    lokasi: "Ruang Meeting A–D",
    jumlahFoto: 52,
    cover: "/galeri-fasilitas-hotel/belakang-gedung.jpg",
    deskripsi: "Diskusi per komisi untuk menyusun rekomendasi program kerja.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Ramah Tamah",
    tanggal: "Selasa, 16 Februari 2027",
    lokasi: "Restoran Hotel",
    jumlahFoto: 29,
    cover: "/galeri-fasilitas-hotel/ruang-makan.jpg",
    deskripsi: "Makan malam bersama dan silaturahmi antar perwakilan wilayah.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Kegiatan Peserta",
    tanggal: "Rabu, 17 Februari 2027",
    lokasi: "Area Hotel",
    jumlahFoto: 24,
    cover: "/galeri-fasilitas-hotel/kamar.jpg",
    deskripsi: "Momen kebersamaan peserta di sela agenda Rakernas.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Penutupan & Pengesahan",
    tanggal: "Rabu, 17 Februari 2027",
    lokasi: "Ballroom Utama",
    jumlahFoto: 41,
    cover: "/galeri-fasilitas-hotel/ruang-acara.jpg",
    deskripsi: "Pengesahan hasil Rakernas dan seremoni penutupan.",
    driveUrl: "https://drive.google.com/",
  },
];
