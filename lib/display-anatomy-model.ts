/**
 * Model murni untuk /display-anatomy. Semua angka, posisi, dan teks figur berasal dari sini
 * sehingga bisa diuji tanpa DOM.
 */

export const ATTENDANCE_COLUMNS =
  "id, session_id, guest_id, nama, perwakilan_daerah, jabatan, departemen, kategori, is_walk_in, checked_in_at";
export const GUEST_COLUMNS = "id, nama, perwakilan_daerah, jabatan, departemen, kategori";

export interface SeatGuest {
  id: string;
  nama: string;
  perwakilan_daerah: string;
}

export interface Seat {
  guestId: string;
  nama: string;
  daerah: string;
  row: number;
  col: number;
}

export interface SeatLayout {
  seats: Seat[];
  rows: number;
  cols: number;
}

/** Jumlah kolom kursi menurut banyaknya tamu, agar aula tetap muat di kolom layar. */
export function seatColumnsFor(count: number): number {
  if (count <= 30) return 6;
  if (count <= 64) return 8;
  if (count <= 120) return 12;
  return 16;
}

/** Kursi per tamu, berurutan menurut perwakilan daerah lalu nama (sama seperti kolom Belum Hadir). */
export function seatLayout(guests: SeatGuest[]): SeatLayout {
  const sorted = [...guests].sort((a, b) => {
    const byDaerah = a.perwakilan_daerah.localeCompare(b.perwakilan_daerah, "id");
    return byDaerah !== 0 ? byDaerah : a.nama.localeCompare(b.nama, "id");
  });
  const cols = seatColumnsFor(sorted.length);
  const seats = sorted.map((g, i) => ({
    guestId: g.id,
    nama: g.nama,
    daerah: g.perwakilan_daerah,
    row: Math.floor(i / cols),
    col: i % cols,
  }));
  return { seats, rows: Math.max(1, Math.ceil(sorted.length / cols)), cols };
}

/** Membagi daftar menjadi halaman berisi `perPage` item (minimal 1 halaman kosong). */
export function pagesOf<T>(items: T[], perPage: number): T[][] {
  const size = Math.max(1, Math.floor(perPage));
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

/** Halaman berikutnya secara melingkar. */
export const nextPage = (page: number, count: number) => (count <= 1 ? 0 : (page + 1) % count);

// ---------- Kenop sesi ----------
export const KNOB_SWEEP = 270;

/** Sudut kenop (derajat, 0 = ke atas, searah jarum jam) untuk sesi ke-i dari n. */
export function knobAngle(index: number, count: number): number {
  if (count <= 1) return 0;
  return -KNOB_SWEEP / 2 + (index * KNOB_SWEEP) / (count - 1);
}

/** Indeks sesi terdekat untuk sudut tertentu. */
export function sessionIndexAt(angle: number, count: number): number {
  if (count <= 1) return 0;
  const raw = Math.round(((angle + KNOB_SWEEP / 2) * (count - 1)) / KNOB_SWEEP);
  return Math.min(count - 1, Math.max(0, raw));
}

// ---------- Jam WIB ----------
const WIB_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function wibParts(date: Date) {
  const parts = Object.fromEntries(WIB_PARTS.formatToParts(date).map((p) => [p.type, p.value]));
  return { h: Number(parts.hour) % 24, m: Number(parts.minute), s: Number(parts.second) };
}

/** Sudut jarum jam (derajat, 0 = jam 12, searah jarum jam). */
export function clockHands(date: Date) {
  const { h, m, s } = wibParts(date);
  return {
    hour: ((h % 12) + m / 60) * 30,
    minute: (m + s / 60) * 6,
    second: s * 6,
  };
}

export function wibClockText(date: Date): string {
  const { h, m, s } = wibParts(date);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ---------- Teks ----------
export function fitText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

export function sessionShortName(nama: string): string {
  return ["Pagi", "Isoma", "Malam"].find((w) => nama.toLowerCase().includes(w.toLowerCase())) ?? fitText(nama, 10);
}

export function hallReadout(hadir: number, total: number): string {
  const pct = total > 0 ? Math.min(100, Math.round((hadir / total) * 100)) : 0;
  return `${hadir}/${total} hadir · ${pct}%`;
}

// ---------- Jam Absen Kartu (sambutan tamu baru) ----------
export const PUNCH_MS = 5000; // sama dengan durasi banner sambutan di /display

export interface PunchPose {
  /** offset vertikal kartu (satuan dunia): + di atas posisi istirahat, − masuk ke slot */
  card: number;
  /** 0..1 seberapa jauh tuas stempel ditekan */
  lever: number;
  /** cap waktu sudah tercetak di kartu */
  stamped: boolean;
  /** 0..1 nyala jendela cetak */
  glow: number;
  /** 0..1 opasitas kartu */
  opacity: number;
}

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export const CARD_ENTER = 30;
export const CARD_INSERT = -30;
export const CARD_EXIT = 70;

/**
 * Pose mesin pada waktu t (ms sejak kartu tamu mulai diproses):
 * turun dari atas → masuk slot → tuas menekan (stempel) → naik dengan cap waktu → keluar ke atas.
 */
export function punchPose(t: number): PunchPose {
  const enter = CARD_ENTER * (1 - smooth(0, 800, t));
  const insert = CARD_INSERT * (smooth(1100, 1600, t) - smooth(2500, 3100, t));
  const exit = CARD_EXIT * smooth(4300, 5000, t);
  const lever = smooth(1650, 1900, t) - smooth(2050, 2400, t);
  return {
    card: enter + insert + exit,
    lever,
    stamped: t >= 1900,
    glow: Math.max(0, lever),
    opacity: smooth(0, 450, t) * (1 - smooth(4500, 5000, t)),
  };
}

/** Tinggi tumpukan kartu (satuan dunia) untuk n dari total, 0 bila kosong. */
export function stackHeight(n: number, total: number, max = 26): number {
  if (n <= 0 || total <= 0) return 0;
  return Math.max(1.2, Math.min(max, (n / total) * max));
}
