// content/rakernas.ts
// Single source of truth untuk seluruh teks, jadwal, tarif, dan tautan landing page Rakernas BMH (/)

export interface NavItem {
  label: string;
  href: string;
}

export interface EventInfo {
  name: string;
  title: string;
  theme: string;
  dateDays: string;
  dateMonthYear: string;
  hotel: string;
  address: string;
  mapsUrl: string;
  countdownTarget: string; // ISO 8601 string
  logoSrc: string;
  logoAlt: string;
}

export interface RundownItem {
  time: string;
  title: string;
  note?: string;
  /** Judul bagian; baris berurutan dengan section sama dikelompokkan di tampilan. */
  section?: string;
  /** Sub-poin bernomor di bawah judul. */
  details?: string[];
}

export interface DresscodeItem {
  src: string;
  alt: string;
  day: string;
  desc: string;
}

export interface GalleryItem {
  src: string;
  caption: string;
}

export interface TransportFare {
  mode: string;
  price: string;
}

export interface TransportItem {
  origin: string;
  /** Perkiraan jarak ke lokasi acara, mis. "± 3-4 km". */
  distance: string;
  icon: "plane" | "train" | "bus";
  fares: TransportFare[];
}

export interface FooterInfo {
  logoSrc: string;
  logoAlt: string;
  text: string;
  committee: {
    label: string;
    url: string;
  };
}

export interface SiteMetadata {
  title: string;
  description: string;
  lang: string;
}

// ---------------------------------------------------------------------------
// DATA IMPLEMENTASI
// ---------------------------------------------------------------------------

export const SITE_METADATA: SiteMetadata = {
  title: "Rakernas BMH",
  description: "Rapat Kerja Nasional BMH 2027. 01–03 Desember 2026 di Hotel Luminor Kota Jakarta Barat.",
  lang: "id",
};

// Tema acara: tampil di hero beranda dan dipakai untuk Open Graph.
export const EVENT_THEME =
  "Akselerasi Pertumbuhan dan Penguatan Resiliensi Menuju BMH Unggul 2030";

export const EVENT_INFO: EventInfo = {
  name: "Rakernas BMH",
  title: "Rapat Kerja Nasional BMH 2027",
  theme: EVENT_THEME,
  dateDays: "01 - 03",
  dateMonthYear: "Desember 2026",
  hotel: "Hotel Luminor",
  address: "Jl. Raya Mangga Besar No.73 1, RT.1/RW.2, Tangki, Kec. Taman Sari, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11170",
  mapsUrl: "https://maps.app.goo.gl/d4RQdTwK9jbx4qZD8",
  countdownTarget: "2026-12-01T10:00:00+07:00",
  logoSrc: "/logo-rakernas-nav.png",
  logoAlt: "Logo Rakernas BMH 2027",
};

/** Anchor section beranda yang muncul di navbar (href "#id"). */
export const NAV_ITEMS: NavItem[] = [
  { label: "Rundown Acara", href: "#rundown" },
  { label: "Dress Code", href: "#dresscode" },
];

/** Tautan navbar: href "/path" = halaman, "#id" = section di beranda. */
export interface NavMenuLink extends NavItem {
  children?: undefined;
}

/** Menu bertingkat (muncul saat hover di desktop, accordion di HP/tablet). */
export interface NavMenuGroup {
  label: string;
  href?: undefined;
  children: NavItem[];
}

export type NavMenuEntry = NavMenuLink | NavMenuGroup;

export const PUBLIKASI_MENU: NavItem[] = [
  { label: "Foto Galeri Kegiatan", href: "/publikasi/foto-galeri-kegiatan" },
  { label: "Materi Presentasi Rakernas", href: "/publikasi/materi-presentasi-rakernas" },
  { label: "Notula Rapat", href: "/publikasi/notula-rapat" },
];

/** Satu sumber kebenaran menu navbar halaman publik. */
export const NAV_MENU: NavMenuEntry[] = [
  { label: "Beranda", href: "/" },
  ...NAV_ITEMS,
  { label: "Informasi Kamar Hotel", href: "/informasi-kamar-hotel" },
  { label: "Publikasi", children: PUBLIKASI_MENU },
];

// Rundown resmi Rakernas BMH 2027. Tanggal tiap hari dihitung dari pengaturan acara (event_settings.starts_at).
// `section` = judul bagian (dikelompokkan di tampilan), `details` = sub-poin bernomor.
export const RUNDOWN_DATA: Record<"hari1" | "hari2" | "hari3", RundownItem[]> = {
  hari1: [
    { section: "A. Registrasi Peserta", time: "10.00 - 12.00", title: "Panitia stand by di lobby utama hotel menyambut dan mengarahkan peserta menuju tempat registrasi" },
    { section: "A. Registrasi Peserta", time: "10.00 - 12.00", title: "Panitia stand by di meja registrasi membantu registrasi dan menyerahkan goodybag berisi Rakernas Kit" },
    { section: "A. Registrasi Peserta", time: "10.00 - 12.00", title: "Peserta diarahkan ke ruang transit/restoran untuk makan siang dan istirahat" },
    { section: "A. Registrasi Peserta", time: "12.00 - 12.30", title: "Shalat berjamaah di musholla" },
    { section: "A. Registrasi Peserta", time: "12.30 - 12.45", title: "Peserta memasuki ruang acara paling lambat pukul 12.45 WIB" },

    { section: "B. Pembukaan", time: "12.30 - 12.45", title: "Ruang Zoom untuk peserta online dibuka" },
    { section: "B. Pembukaan", time: "12.45 - 13.00", title: "Penampilan Tim Hadroh dari Santri Binaan BMH" },
    { section: "B. Pembukaan", time: "13.00 - 13.10", title: "Pembukaan oleh MC" },
    { section: "B. Pembukaan", time: "13.10 - 13.20", title: "Tilawah" },
    { section: "B. Pembukaan", time: "13.20 - 13.30", title: "Menyanyikan Indonesia Raya & Mars BMH" },
    { section: "B. Pembukaan", time: "13.30 - 13.40", title: "Penampilan Tim Hadroh" },
    { section: "B. Pembukaan", time: "13.40 - 13.50", title: "Sambutan Ketua Panitia Rakernas BMH" },
    { section: "B. Pembukaan", time: "13.50 - 14.00", title: "Sambutan Ketua Pengurus BMH" },
    { section: "B. Pembukaan", time: "14.00 - 14.10", title: "Sambutan Ketua Pembina BMH" },
    { section: "B. Pembukaan", time: "14.10 - 14.25", title: "Sambutan Dirzawa Kemenag RI dan pembukaan acara secara resmi" },
    { section: "B. Pembukaan", time: "14.25 - 14.55", title: "Pengumuman dan penyerahan Apresiasi BMH Award 2026 + foto bersama" },
    { section: "B. Pembukaan", time: "14.45 - 14.55", title: "Pembacaan doa" },
    { section: "B. Pembukaan", time: "14.55 - 15.50", title: "Penutup acara oleh MC" },

    { section: "C. Check-in Kamar Hotel", time: "15.00 - 16.00", title: "Check-in kamar hotel (kunci diambil di meja registrasi)" },

    { section: "D. Orientasi Kelembagaan", time: "16.00 - 16.40", title: "Orientasi Kelembagaan" },
    { section: "D. Orientasi Kelembagaan", time: "16.40 - 16.50", title: "Coffee Break" },

    { section: "E. Laporan Kinerja BMH 2026", time: "16.50 - 17.45", title: "Laporan Kinerja BMH 2026" },
    { section: "E. Laporan Kinerja BMH 2026", time: "17.45 - 19.30", title: "Ishoma" },

    { section: "F. Sosialisasi Kebijakan", time: "19.30 - 20.25", title: "Sosialisasi Kebijakan" },
    { section: "F. Sosialisasi Kebijakan", time: "20.25 - 20.30", title: "Coffee Break" },

    { section: "G. Paparan Strategi 2027", time: "20.30 - 21.30", title: "Paparan Strategi 2027" },
  ],
  hari2: [
    { time: "03.00 - 04.00", title: "Sholat Lail" },
    { time: "04.00 - 04.30", title: "Sholat Shubuh & Wirid" },
    { time: "04.30 - 06.00", title: "H. Tausiyah (1)" },
    { time: "06.00 - 08.00", title: "Olahraga, sarapan dan persiapan" },
    { time: "08.00 - 10.00", title: "I. Presentasi Direktorat Prodaya" },
    { time: "10.00 - 12.00", title: "J. Presentasi Direktorat Marketing" },
    { time: "12.00 - 13.00", title: "Ishoma" },
    { time: "13.00 - 15.00", title: "K. Presentasi Direktorat Seklem" },
    { time: "15.00 - 16.00", title: "Coffee Break" },
    { time: "16.00 - 17.30", title: "L. Presentasi Direktorat Operasional" },
    { time: "17.30 - 19.30", title: "Ishoma" },
    { time: "19.30 - 20.25", title: "M. Presentasi Direktorat Jaringan" },
    { time: "20.25 - 20.30", title: "Coffee Break" },
    { time: "20.30 - 21.30", title: "N. Presentasi Pengawasan" },
  ],
  hari3: [
    { time: "03.00 - 04.00", title: "Sholat Lail" },
    { time: "04.00 - 04.30", title: "Sholat Shubuh & Wirid" },
    { time: "04.30 - 06.00", title: "O. Tausiyah (2)" },
    { time: "06.00 - 07.00", title: "Olahraga, sarapan dan persiapan" },
    { time: "07.00 - 08.30", title: "P. Workshop Project Manajemen" },
    { time: "08.30 - 10.00", title: "W. Leadership Training" },
    { time: "10.00 - 10.30", title: "X. Pembacaan Rekomendasi" },
    {
      time: "10.30 - 12.00",
      title: "Y. Penutupan",
      details: [
        "Pembukaan",
        "Tilawah Al Qur’an",
        "Sambutan Ketua Panitia",
        "Sambutan Ketua Pengurus",
        "Sambutan Pembina BMH",
        "Pembacaan SK Penugasan",
        "Doa",
        "Penutup",
      ],
    },
  ],
};

export const DRESSCODE_DATA: DresscodeItem[] = [
  {
    src: "/dresscode/hari-pertama.png",
    alt: "Dress code hari pertama: kemeja lengan panjang, jas, dan songkok nasional",
    day: "Hari Pertama",
    desc: "Kemeja lengan panjang + Jas + Songkok Nasional.",
  },
  {
    src: "/dresscode/hari-kedua.png",
    alt: "Dress code hari kedua: baju koko dan songkok nasional",
    day: "Hari Kedua",
    desc: "Baju koko + Songkok Nasional.",
  },
  {
    src: "/dresscode/hari-ketiga.png",
    alt: "Dress code hari ketiga: batik lengan panjang dan songkok nasional",
    day: "Hari Ketiga",
    desc: "Batik lengan panjang + Songkok Nasional.",
  },
];

export const LOCATION_DATA = {
  title: "Lokasi Rakernas",
  map: {
    // [longitude, latitude], dari tautan Maps pada situs resmi Hotel Luminor Kota.
    coordinates: [106.823191, -6.148531] as [number, number],
    zoom: 15,
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
  },
  banner: {
    src: "/rakernas/hotel-grasia-banner.png",
    alt: "Hotel Luminor Kota Jakarta Barat",
  },
  hotel: EVENT_INFO.hotel,
  address: EVENT_INFO.address,
  mapsUrl: EVENT_INFO.mapsUrl,
  mapsButtonLabel: "Google Map Hotel Luminor",
  gallery: [
    {
      src: "/rakernas/galeri-gedung-utama.webp",
      caption: "Gedung Utama",
    },
    {
      src: "/rakernas/galeri-ruang-acara.webp",
      caption: "Ruang Acara",
    },
    {
      src: "/rakernas/galeri-masjid.jpg",
      caption: "Masjid",
    },
    {
      src: "/rakernas/galeri-restaurant.webp",
      caption: "Restaurant",
    },
    {
      src: "/rakernas/galeri-kamar-1.jpg",
      caption: "Kamar",
    },
    {
      src: "/rakernas/galeri-kamar-2.webp",
      caption: "Kamar",
    },
    {
      src: "/rakernas/galeri-kolam-renang.webp",
      caption: "Kolam Renang",
    },
    {
      src: "/rakernas/galeri-area-parkir.webp",
      caption: "Area Parkir",
    },
  ] as GalleryItem[],
};

export const TRANSPORT_DATA = {
  title: "Info Transportasi",
  subtitle: "menuju Hotel Luminor",
  items: [
    {
      origin: "Stasiun Pasar Senen",
      distance: "± 3-4 km",
      icon: "train" as const,
      fares: [
        { mode: "Taksi Konvensional", price: "Rp 30.000 - 50.000" },
        { mode: "Taksi Online", price: "Rp 25.000 - 40.000" },
        { mode: "Ojek Online", price: "Rp 12.000 - 20.000" },
      ],
    },
    {
      origin: "Stasiun Gambir",
      distance: "± 5-6 km",
      icon: "train" as const,
      fares: [
        { mode: "Taksi Konvensional", price: "Rp 40.000 - 60.000" },
        { mode: "Taksi Online", price: "Rp 30.000 - 50.000" },
        { mode: "Ojek Online", price: "Rp 15.000 - 25.000" },
      ],
    },
    {
      origin: "Terminal Tanjung Priok",
      distance: "± 9-10 km",
      icon: "bus" as const,
      fares: [
        { mode: "Taksi Konvensional", price: "Rp 60.000 - 90.000" },
        { mode: "Taksi Online", price: "Rp 45.000 - 70.000" },
        { mode: "Ojek Online", price: "Rp 25.000 - 40.000" },
      ],
    },
    {
      origin: "Terminal Pulogadung",
      distance: "± 10-11 km",
      icon: "bus" as const,
      fares: [
        { mode: "Taksi Konvensional", price: "Rp 60.000 - 90.000" },
        { mode: "Taksi Online", price: "Rp 45.000 - 70.000" },
        { mode: "Ojek Online", price: "Rp 25.000 - 40.000" },
      ],
    },
    {
      origin: "Bandara Halim Perdanakusuma",
      distance: "± 14-16 km",
      icon: "plane" as const,
      fares: [
        { mode: "Taksi Bandara", price: "Rp 90.000 - 140.000" },
        { mode: "Taksi Online", price: "Rp 65.000 - 100.000" },
        { mode: "Ojek Online", price: "Rp 40.000 - 60.000" },
      ],
    },
    {
      origin: "Terminal Kalideres",
      distance: "± 17-19 km",
      icon: "bus" as const,
      fares: [
        { mode: "Taksi Konvensional", price: "Rp 110.000 - 160.000" },
        { mode: "Taksi Online", price: "Rp 80.000 - 120.000" },
        { mode: "Ojek Online", price: "Rp 50.000 - 75.000" },
      ],
    },
    {
      origin: "Terminal Kampung Rambutan",
      distance: "± 22-25 km",
      icon: "bus" as const,
      fares: [
        { mode: "Taksi Konvensional", price: "Rp 120.000 - 180.000" },
        { mode: "Taksi Online", price: "Rp 90.000 - 140.000" },
        { mode: "Ojek Online", price: "Rp 60.000 - 90.000" },
      ],
    },
    {
      origin: "Bandara Soekarno-Hatta",
      distance: "± 30 km",
      icon: "plane" as const,
      fares: [
        { mode: "Taksi Bandara", price: "Rp 200.000 - 300.000" },
        { mode: "Taksi Online", price: "Rp 150.000 - 230.000" },
        { mode: "Ojek Online", price: "Rp 100.000 - 150.000" },
      ],
    },
  ] as TransportItem[],
  /** Pengumuman di bagian bawah section. Kata "panitia" ditautkan ke footer_url pada event settings. */
  announcement: {
    text: "H-1 Panitia menyediakan tempat transit di: Guest House YPPH Depok, konfirmasi ke ",
    linkLabel: "panitia",
    mapsLabel: "Lihat di Google Maps",
    mapsUrl: "https://maps.app.goo.gl/LrBzn1tPFqKaRFTTA",
  },
};

export const INVITED_GUESTS_CONTENT = {
  badge: "Informasi Tamu",
  title: "Peserta Rakernas",
  description: "Temukan detail peserta berdasarkan nama, perwakilan daerah, jabatan, atau departemen.",
  statusAccepted: "Sudah diterima",
  acceptedGroupTitle: "Sudah diterima",
  searchLabel: "Cari peserta",
  searchPlaceholder: "Cari Nama Anda…",
  searchHint: "Ketik minimal 2 karakter. Hasil diperbarui otomatis saat Anda mengetik.",
  clearLabel: "Hapus pencarian",
  detailsTitle: "Detail Peserta",
  fields: {
    nama: "Nama",
    perwakilan_daerah: "Perwakilan daerah",
    jabatan: "Jabatan",
    departemen: "Departemen",
  },
  missingValue: "Belum dicantumkan",
  initialTitle: "Temukan Nama, Perwakilan Daerah, Jabatan, atau Departemen Anda",
  initialDescription: "Mulai dengan mengetik nama, perwakilan daerah, jabatan, atau departemen pada kolom pencarian.",
  loading: "Sedang mencari peserta…",
  emptyTitle: "Peserta belum ditemukan",
  emptyDescription: "Coba kata kunci lain atau periksa kembali ejaan Anda.",
  errorTitle: "Pencarian belum tersedia",
  errorDescription: "Data tamu belum dapat dimuat. Silakan coba lagi.",
  invalidRequest: "Gunakan kata kunci 2–100 karakter dan nomor halaman yang valid.",
  retryLabel: "Coba lagi",
  previousLabel: "Sebelumnya",
  nextLabel: "Berikutnya",
  paginationLabel: "Halaman hasil pencarian peserta",
  resultsCount: (total: number) => `${total.toLocaleString("id-ID")} peserta ditemukan`,
  pageLabel: (page: number, totalPages: number) => `Halaman ${page} dari ${totalPages}`,
};

export const FOOTER_DATA: FooterInfo = {
  logoSrc: "/logo-rakernas-nav.png",
  logoAlt: "Logo Rakernas BMH 2027",
  text: "08-10 Desember 2026 | Hotel Luminor Kota Jakarta Barat @2026",
  committee: {
    label: "Panitia Rakernas",
    url: "https://wa.me/6289517795206",
  },
};
