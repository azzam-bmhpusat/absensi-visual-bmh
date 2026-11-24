export type NotulaRapat = {
  judul: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  pimpinan: string;
  notulis: string;
  jumlahPeserta: number;
  keputusan: string[];
  status: "Final" | "Draf";
  /** Link dokumen notula di Google Drive; isi nanti setelah notula diunggah. */
  driveUrl: string;
};

/** Data dummy notula rapat Rakernas (sementara, sebelum notula asli diunggah). */
export const NOTULA_RAPAT: NotulaRapat[] = [
  {
    judul: "Sidang Pleno I",
    tanggal: "Senin, 15 Februari 2027",
    waktu: "09.00–12.00 WIB",
    tempat: "Ballroom Utama",
    pimpinan: "Ketua Umum BMH",
    notulis: "Sekretariat Rakernas",
    jumlahPeserta: 210,
    keputusan: [
      "Laporan kinerja tahun berjalan diterima peserta",
      "Tata tertib Rakernas disahkan",
    ],
    status: "Final",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Sidang Pleno II",
    tanggal: "Senin, 15 Februari 2027",
    waktu: "13.30–16.00 WIB",
    tempat: "Ballroom Utama",
    pimpinan: "Direktur Program",
    notulis: "Sekretariat Rakernas",
    jumlahPeserta: 205,
    keputusan: [
      "Arah kebijakan program disepakati sebagai acuan komisi",
      "Pembagian peserta ke tiga komisi ditetapkan",
    ],
    status: "Final",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Komisi A — Program",
    tanggal: "Selasa, 16 Februari 2027",
    waktu: "08.30–12.00 WIB",
    tempat: "Ruang Meeting A",
    pimpinan: "Koordinator Komisi A",
    notulis: "Tim Notulis Komisi A",
    jumlahPeserta: 72,
    keputusan: [
      "Program prioritas dakwah pedalaman diperluas",
      "Target penerima manfaat pendidikan dinaikkan",
      "Evaluasi program dilakukan per semester",
    ],
    status: "Final",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Komisi B — SDM",
    tanggal: "Selasa, 16 Februari 2027",
    waktu: "08.30–12.00 WIB",
    tempat: "Ruang Meeting B",
    pimpinan: "Koordinator Komisi B",
    notulis: "Tim Notulis Komisi B",
    jumlahPeserta: 68,
    keputusan: [
      "Standar kompetensi amil disusun ulang",
      "Pelatihan dai dilaksanakan dua kali setahun",
    ],
    status: "Draf",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Komisi C — Keuangan",
    tanggal: "Selasa, 16 Februari 2027",
    waktu: "08.30–12.00 WIB",
    tempat: "Ruang Meeting C",
    pimpinan: "Koordinator Komisi C",
    notulis: "Tim Notulis Komisi C",
    jumlahPeserta: 65,
    keputusan: [
      "Pelaporan keuangan wilayah wajib bulanan",
      "Audit syariah internal diperkuat",
    ],
    status: "Draf",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Pleno Penutupan",
    tanggal: "Rabu, 17 Februari 2027",
    waktu: "09.00–11.30 WIB",
    tempat: "Ballroom Utama",
    pimpinan: "Ketua Umum BMH",
    notulis: "Sekretariat Rakernas",
    jumlahPeserta: 215,
    keputusan: [
      "Rekomendasi seluruh komisi disahkan",
      "Hasil Rakernas menjadi pedoman kerja tahun depan",
    ],
    status: "Final",
    driveUrl: "https://drive.google.com/",
  },
];
