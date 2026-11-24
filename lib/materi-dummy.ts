export type MateriPresentasi = {
  judul: string;
  pemateri: string;
  jabatan: string;
  sesi: string;
  tanggal: string;
  format: "PDF" | "PPTX";
  ukuran: string;
  deskripsi: string;
  /** Link file di Google Drive; isi nanti setelah materi diunggah. */
  driveUrl: string;
};

/** Data dummy materi presentasi Rakernas (sementara, sebelum materi asli diunggah). */
export const MATERI_PRESENTASI: MateriPresentasi[] = [
  {
    judul: "Laporan Kinerja BMH",
    pemateri: "Ketua Umum BMH",
    jabatan: "Pimpinan Pusat",
    sesi: "Sidang Pleno I",
    tanggal: "Senin, 15 Februari 2027",
    format: "PDF",
    ukuran: "3,2 MB",
    deskripsi: "Capaian program, penghimpunan, dan penyaluran BMH sepanjang tahun berjalan.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Arah Kebijakan Program",
    pemateri: "Direktur Program",
    jabatan: "BMH Pusat",
    sesi: "Sidang Pleno II",
    tanggal: "Senin, 15 Februari 2027",
    format: "PPTX",
    ukuran: "8,5 MB",
    deskripsi: "Prioritas program dakwah, pendidikan, sosial, dan ekonomi untuk tahun depan.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Strategi Fundraising Digital",
    pemateri: "Direktur Penghimpunan",
    jabatan: "BMH Pusat",
    sesi: "Sidang Komisi A",
    tanggal: "Selasa, 16 Februari 2027",
    format: "PDF",
    ukuran: "2,4 MB",
    deskripsi: "Optimasi kanal digital, kampanye daring, dan retensi donatur.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Penguatan SDM & Dai",
    pemateri: "Kepala Divisi SDM",
    jabatan: "BMH Pusat",
    sesi: "Sidang Komisi B",
    tanggal: "Selasa, 16 Februari 2027",
    format: "PPTX",
    ukuran: "5,1 MB",
    deskripsi: "Rencana rekrutmen, pembinaan, dan pengembangan kompetensi amil serta dai.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Tata Kelola Keuangan",
    pemateri: "Direktur Keuangan",
    jabatan: "BMH Pusat",
    sesi: "Sidang Komisi C",
    tanggal: "Selasa, 16 Februari 2027",
    format: "PDF",
    ukuran: "1,8 MB",
    deskripsi: "Standar pelaporan, audit syariah, dan akuntabilitas pengelolaan dana.",
    driveUrl: "https://drive.google.com/",
  },
  {
    judul: "Rekomendasi Hasil Komisi",
    pemateri: "Tim Perumus",
    jabatan: "Panitia Rakernas",
    sesi: "Sidang Pleno Penutupan",
    tanggal: "Rabu, 17 Februari 2027",
    format: "PDF",
    ukuran: "1,2 MB",
    deskripsi: "Rangkuman rekomendasi seluruh komisi untuk disahkan sebagai hasil Rakernas.",
    driveUrl: "https://drive.google.com/",
  },
];
