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
}

export interface DresscodeItem {
  src: string;
  alt: string;
}

export interface GalleryItem {
  src: string;
  caption: string;
  alt: string;
}

export interface TransportFare {
  mode: string;
  price: string;
}

export interface TransportItem {
  origin: string;
  icon: "plane" | "train" | "bus";
  fares: TransportFare[];
}

export interface RegistrationInfo {
  title: string;
  steps: string[];
  bank: {
    label: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  actions: {
    form: {
      label: string;
      url: string;
    };
    confirm: {
      label: string;
      url: string;
    };
  };
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

export const EVENT_INFO: EventInfo = {
  name: "Rakernas BMH",
  title: "Rapat Kerja Nasional BMH 2027",
  theme: "Konsolidasi Jati Diri dan Transformasi Organisasi Menuju Hidayatullah Mandiri dan Berpengaruh",
  dateDays: "01 - 03",
  dateMonthYear: "Desember 2026",
  hotel: "Hotel Luminor",
  address: "Jl. Raya Mangga Besar No.73 1, RT.1/RW.2, Tangki, Kec. Taman Sari, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11170",
  mapsUrl: "https://maps.app.goo.gl/d4RQdTwK9jbx4qZD8",
  countdownTarget: "2026-12-01T10:00:00+07:00",
  logoSrc: "/logo.png",
  logoAlt: "Logo Rakernas BMH 2027",
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Rundown Acara", href: "#rundown" },
  { label: "Dress Code", href: "#dresscode" },
  { label: "Lokasi Rakernas", href: "#lokasi" },
  { label: "Info Transportasi", href: "#transportasi" },
  { label: "Cara Mendaftar", href: "#pendaftaran" },
];

export const RUNDOWN_DATA: Record<"hari1" | "hari2" | "hari3", RundownItem[]> = {
  hari1: [
    { time: "10.00", title: "Check in" },
    { time: "11.00", title: "Makan Siang" },
    { time: "11.30", title: "Sholat Dzuhur" },
    { time: "13.00", title: "Pembukaan" },
    { time: "15.00", title: "Break" },
    {
      time: "16.00",
      title: "Rapat Pleno 1 (Presentasi Program Kerja Bidang Pendidikan)",
      note: "Presentasi Program Kerja Bidang Pendidikan",
    },
    { time: "17.30", title: "Ishoma" },
    {
      time: "19.30",
      title: "Rapat Pleno 2 (Presentasi Program Kerja Bidang Dakwah & Pelayanan Ummat)",
      note: "Presentasi Program Kerja Bidang Dakwah & Pelayanan Ummat",
    },
    {
      time: "21.00",
      title: "Rapat Pleno 3 (Presentasi Program Bidang Rekrutmen, Pengkaderan & Pembinaan Anggota)",
      note: "Presentasi Program Bidang Rekrutmen, Pengkaderan & Pembinaan Anggota",
    },
    {
      time: "22.30",
      title: "Istirahat (tidur)",
      note: "tidur",
    },
  ],
  // Rundown Hari 2 & 3: Sesuai PRD A.5 & A.9 serta keputusan Fase 0,
  // diisi teks sementara sampai data resmi disalin dari panitia.
  hari2: [
    { time: "-", title: "Rundown akan segera diumumkan" },
  ],
  hari3: [
    { time: "-", title: "Rundown akan segera diumumkan" },
  ],
};

export const DRESSCODE_DATA: DresscodeItem[] = [
  { src: "/rakernas/dresscode-1.webp", alt: "Dress Code 1" },
  { src: "/rakernas/dresscode-2.webp", alt: "Dress Code 2" },
  { src: "/rakernas/dresscode-3.webp", alt: "Dress Code 3" },
  { src: "/rakernas/dresscode-4.webp", alt: "Dress Code 4" },
  { src: "/rakernas/dresscode-5.webp", alt: "Dress Code 5" },
];

export const LOCATION_DATA = {
  title: "Lokasi Rakernas",
  map: {
    // [longitude, latitude], dari tautan Maps pada situs resmi Hotel Luminor Kota.
    coordinates: [106.823191, -6.148531] as [number, number],
    zoom: 16,
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
      alt: "Hotel Luminor — Gedung Utama",
    },
    {
      src: "/rakernas/galeri-ruang-acara.webp",
      caption: "Ruang Acara",
      alt: "Hotel Luminor — Ruang Acara",
    },
    {
      src: "/rakernas/galeri-masjid.jpg",
      caption: "Masjid",
      alt: "Hotel Luminor — Masjid",
    },
    {
      src: "/rakernas/galeri-restaurant.webp",
      caption: "Restaurant",
      alt: "Hotel Luminor — Restaurant",
    },
    {
      src: "/rakernas/galeri-kamar-1.jpg",
      caption: "Kamar",
      alt: "Hotel Luminor — Kamar 1",
    },
    {
      src: "/rakernas/galeri-kamar-2.webp",
      caption: "Kamar",
      alt: "Hotel Luminor — Kamar 2",
    },
    {
      src: "/rakernas/galeri-kolam-renang.webp",
      caption: "Kolam Renang",
      alt: "Hotel Luminor — Kolam Renang",
    },
    {
      src: "/rakernas/galeri-area-parkir.webp",
      caption: "Area Parkir",
      alt: "Hotel Luminor — Area Parkir",
    },
  ] as GalleryItem[],
};

export const TRANSPORT_DATA = {
  title: "Info Transportasi",
  subtitle: "menuju Hotel Luminor",
  items: [
    {
      origin: "Bandara Ahmad Yani",
      icon: "plane" as const,
      fares: [
        { mode: "Taksi Bandara", price: "Rp. 70.000 - 100.000" },
        { mode: "Taksi Online", price: "Rp. 45.000 - 65.000" },
        { mode: "Ojek Online", price: "Rp. 20.000 - 30.000" },
      ],
    },
    {
      origin: "Stasiun Tawang",
      icon: "train" as const,
      fares: [
        { mode: "Taksi Stasiun", price: "Rp. 30.000 - 40.000" },
        { mode: "Taksi Online", price: "Rp. 20.000 - 30.000" },
        { mode: "Ojek Online", price: "Rp. 12.000 - 18.000" },
      ],
    },
    {
      origin: "Stasiun Poncol",
      icon: "train" as const,
      fares: [
        { mode: "Taksi Stasiun", price: "Rp. 25.000 - 35.000" },
        { mode: "Taksi Online", price: "Rp. 15.000 - 25.000" },
        { mode: "Ojek Online", price: "Rp. 10.000 - 15.000" },
      ],
    },
    {
      origin: "Terminal Mangkang",
      icon: "bus" as const,
      fares: [
        { mode: "Taksi Terminal", price: "Rp. 80.000 - 110.000" },
        { mode: "Taksi Online", price: "Rp. 60.000 - 90.000" },
        { mode: "Ojek Online", price: "Rp. 35.000 - 50.000" },
      ],
    },
    {
      origin: "Terminal Terboyo",
      icon: "bus" as const,
      fares: [
        { mode: "Taksi Terminal", price: "Rp. 45.000 - 60.000" },
        { mode: "Taksi Online", price: "Rp. 30.000 - 45.000" },
        { mode: "Ojek Online", price: "Rp. 18.000 - 25.000" },
      ],
    },
    {
      origin: "Terminal Banyumanik",
      icon: "bus" as const,
      fares: [
        { mode: "Taksi Terminal", price: "Rp. 50.000 - 65.000" },
        { mode: "Taksi Online", price: "Rp. 35.000 - 50.000" },
        { mode: "Ojek Online", price: "Rp. 20.000 - 28.000" },
      ],
    },
  ] as TransportItem[],
};

export const REGISTRATION_DATA: RegistrationInfo = {
  title: "Cara Mendaftar",
  steps: [
    "Transfer Rp.1.000.000/peserta ke Rekening Pembayaran",
    "Isi data peserta di form yg telah disediakan",
    "Upload bukti transfer",
    "Konfirmasi pembayaran ke panitia",
  ],
  bank: {
    label: "REKENING PEMBAYARAN",
    bankName: "BANK SYARIAH INDONESIA (BSI)",
    accountNumber: "9999-8866-17",
    accountHolder: "an. DPW Hidayatullah Jateng",
  },
  actions: {
    form: {
      label: "Isi Data Peserta",
      url: "https://forms.gle/8E5oksPuZpKvvjQR6",
    },
    confirm: {
      label: "Konfirmasi Pembayaran",
      url: "https://wa.me/6283842037788?text=Bismillah,%20saya%20sudah%20mengisi%20form%20pendaftaran%20Rakernas%202027",
    },
  },
};

export const FOOTER_DATA: FooterInfo = {
  logoSrc: "/logo.png",
  logoAlt: "Logo Rakernas BMH 2027",
  text: "01-03 Desember 2026 | Hotel Luminor Kota Jakarta Barat @2026",
  committee: {
    label: "Panitia Rakernas",
    url: "https://hidayatullahjateng.or.id/",
  },
};
