/**
 * Model murni /display-absen (tanpa DOM): tata letak aula, kursi, jalur jalan tamu, varian sosok.
 * Satuan dunia ≈ 1 px benda nyata: x = lebar aula, y = kedalaman (panggung di y negatif), z = tinggi.
 */
import type { AttendanceData, GuestData } from "@/lib/display-helpers";

// ---------- Konstanta dunia ----------
export const SEAT_W = 16;
export const SEAT_D = 12;
export const PITCH_X = 22;
export const PITCH_Y = 26;
export const LANE = PITCH_Y - SEAT_D; // jalur kaki di depan tiap baris
export const RISE = 2.4; // kenaikan tiap baris tribun
export const AISLE = 14; // lorong antarblok
export const SIDE = 12; // lorong samping
export const STAGE_D = 72;
export const STAGE_GAP = 20;
export const STAGE_H = 10;
export const WALL_H = 92;
export const TRUSS_Z = 134;
export const DECK_D = 34;
export const AZIMUTH = 84;
export const ELEVATION = 42;
export const ASPECT_MIN = 1.25;
export const ASPECT_MAX = 2.6;
export const WING_TARGET = 120;
export const WING_MIN = 70;

// ---------- Tamu & kursi ----------
export interface SeatEntry {
  /** kunci stabil: id tamu, atau `w:<id absensi>` untuk walk-in */
  key: string;
  nama: string;
  daerah: string;
  jabatan?: string | null;
  departemen?: string | null;
  kategori?: string | null;
  attendanceId: string | null;
  checkedInAt: string | null;
  walkIn: boolean;
}

/** Satu kursi per tamu terdaftar (urut daerah lalu nama) + satu per walk-in (urut waktu hadir). */
export function buildSeats(guests: GuestData[], attendances: AttendanceData[]): SeatEntry[] {
  const byGuest = new Map<string, AttendanceData>();
  for (const a of attendances) if (a.guest_id && !byGuest.has(a.guest_id)) byGuest.set(a.guest_id, a);
  const sorted = [...guests].sort((a, b) => {
    const d = (a.perwakilan_daerah ?? "").localeCompare(b.perwakilan_daerah ?? "", "id");
    return d !== 0 ? d : a.nama.localeCompare(b.nama, "id");
  });
  const known = new Set(guests.map((g) => g.id));
  const seats: SeatEntry[] = sorted.map((g) => {
    const a = byGuest.get(g.id);
    return {
      key: g.id,
      nama: g.nama,
      daerah: g.perwakilan_daerah,
      jabatan: g.jabatan,
      departemen: g.departemen,
      kategori: g.kategori,
      attendanceId: a?.id ?? null,
      checkedInAt: a?.checked_in_at ?? null,
      walkIn: false,
    };
  });
  const walkIns = attendances
    .filter((a) => !a.guest_id || !known.has(a.guest_id))
    .sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime());
  for (const a of walkIns) {
    seats.push({
      key: `w:${a.id}`,
      nama: a.nama,
      daerah: a.perwakilan_daerah,
      jabatan: a.jabatan,
      departemen: a.departemen,
      kategori: a.kategori,
      attendanceId: a.id,
      checkedInAt: a.checked_in_at,
      walkIn: true,
    });
  }
  return seats;
}

/** Kapasitas kursi (termasuk cadangan walk-in), dibulatkan agar tata letak tidak bergeser tiap tamu baru. */
export function capacityFor(count: number): number {
  const spare = Math.max(6, Math.ceil(count * 0.06));
  return Math.max(16, Math.ceil((count + spare) / 8) * 8);
}

/** id absensi yang baru muncul dibanding yang sudah diketahui. */
export function newArrivals(known: ReadonlySet<string>, ids: readonly string[]): string[] {
  return ids.filter((id) => !known.has(id));
}

// ---------- Tata letak aula ----------
export interface HallPlan {
  capacity: number;
  cols: number;
  rows: number;
  blocks: number;
  blockSize: number;
  blockW: number;
  stageW: number;
  floorW: number;
  floorD: number;
  wing: number;
  aspect: number;
  /** kunci memo: bentuk yang sama = geometri yang sama */
  key: string;
}

export const clampAspect = (a: number) => Math.min(ASPECT_MAX, Math.max(ASPECT_MIN, Number.isFinite(a) ? a : 16 / 9));
/** Bulatkan ke 0.05 agar geometri tidak dibangun ulang tiap piksel. */
export const bucketAspect = (a: number) => Math.round(clampAspect(a) * 20) / 20;

export function blockLayout(cols: number) {
  const blocks = cols <= 4 ? 1 : Math.max(2, Math.ceil(cols / 8));
  return { blocks, blockSize: Math.ceil(cols / blocks) };
}

export const blockWidth = (cols: number) => {
  const { blocks } = blockLayout(cols);
  return cols * PITCH_X + (blocks - 1) * AISLE;
};

export const yBackOf = () => -STAGE_GAP - STAGE_D;
export const yFrontOf = (rows: number) => rows * PITCH_Y + DECK_D;
export const zDeckOf = (rows: number) => (rows + 1) * RISE;

/** Rasio lebar:tinggi hasil proyeksi untuk lantai selebar floorW (satuan kamera = 1). */
export function projectedAspect(floorW: number, rows: number): number {
  const a = (AZIMUTH * Math.PI) / 180;
  const e = (ELEVATION * Math.PI) / 180;
  const yb = yBackOf() - 14;
  const yf = yFrontOf(rows) + 14;
  const zd = zDeckOf(rows);
  const pts: Array<[number, number, number]> = [];
  for (const x of [-floorW / 2, floorW / 2]) {
    for (const y of [yb, yf]) pts.push([x, y, -14]);
    pts.push([x, yb + 20, TRUSS_Z + 12]);
    pts.push([x, yf, zd + 52]);
  }
  const xs = pts.map(([x, y]) => x * Math.sin(a) - y * Math.cos(a));
  const ys = pts.map(([x, y, z]) => (x * Math.cos(a) + y * Math.sin(a)) * Math.sin(e) - z * Math.cos(e));
  return (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys));
}

/** Lebar lantai agar proyeksinya tepat selebar layar (bisection; aspek naik terhadap lebar). */
export function floorWidthFor(aspect: number, rows: number, minW: number): number {
  let lo = minW;
  let hi = 2600;
  if (projectedAspect(lo, rows) >= aspect) return lo;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (projectedAspect(mid, rows) < aspect) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function planHall(capacity: number, aspectIn: number): HallPlan {
  const aspect = bucketAspect(aspectIn);
  let best: HallPlan | null = null;
  let bestScore = Infinity;
  for (let cols = 4; cols <= 32; cols++) {
    const rows = Math.max(1, Math.ceil(capacity / cols));
    if (rows > 1 && (rows - 1) * cols >= capacity) continue; // baris kosong penuh
    const { blocks, blockSize } = blockLayout(cols);
    const blockW = blockWidth(cols);
    const stageW = blockW + SIDE * 2;
    const floorW = floorWidthFor(aspect, rows, stageW + WING_MIN * 2);
    const wing = (floorW - stageW) / 2;
    // lantai paling sempit yang masih menutup lebar layar = skala terbesar (sosok terbesar);
    // sayap kurang dari WING_MIN tak muat properti, lebih dari WING_TARGET menyisakan ruang kosong.
    // lantai terpaksa melebar (sayap minimum) → proyeksi lebih lebar dari layar → sisa ruang di atas/bawah
    const excess = Math.max(0, projectedAspect(floorW, rows) - aspect);
    const score = floorW + (wing > WING_TARGET ? (wing - WING_TARGET) * 3 : 0) + (rows > cols * 1.6 ? 200 : 0) + excess * 1500;
    if (score < bestScore) {
      bestScore = score;
      const floorD = yFrontOf(rows) - yBackOf() + 28;
      best = { capacity, cols, rows, blocks, blockSize, blockW, stageW, floorW, floorD, wing, aspect, key: `${cols}x${rows}@${aspect}` };
    }
  }
  return best as HallPlan;
}

// ---------- Posisi dalam aula ----------
export interface SeatPos {
  index: number;
  row: number;
  col: number;
  /** pusat kursi */
  x: number;
  y: number;
  /** tinggi lantai tribun di baris ini */
  z: number;
}

export const rowZ = (row: number) => (row + 1) * RISE;
export const laneStartY = (row: number) => row * PITCH_Y;
export const seatY = (row: number) => LANE + row * PITCH_Y + SEAT_D / 2;

export function seatPos(plan: Pick<HallPlan, "cols" | "blockSize" | "blockW">, index: number): SeatPos {
  const row = Math.floor(index / plan.cols);
  const col = index % plan.cols;
  const block = Math.floor(col / plan.blockSize);
  const x = -plan.blockW / 2 + col * PITCH_X + block * AISLE + PITCH_X / 2;
  return { index, row, col, x, y: seatY(row), z: rowZ(row) };
}

/** Baris tempat benda di kedalaman y digambar (0..rows; rows = teras belakang). */
export function slotOfY(y: number, rows: number): number {
  return Math.min(rows, Math.max(0, Math.floor(y / PITCH_Y)));
}

// ---------- Jalur jalan tamu ----------
export type V3 = [number, number, number];

/** Tangga di sisi kiri teras: dari lantai aula naik ke teras belakang (searah sumbu x). */
export const STEP_W = 3;
export function stairOf(plan: Pick<HallPlan, "blockW" | "rows">) {
  const top = zDeckOf(plan.rows);
  const steps = Math.max(1, Math.ceil(top / RISE));
  const edgeX = -plan.blockW / 2 - SIDE; // tepi kiri teras
  return { steps, edgeX, footX: edgeX - steps * STEP_W, y: yFrontOf(plan.rows) - 9, top };
}

/** Gerbang masuk berdiri di LANTAI aula, di depan kaki tangga teras. */
export function gatePos(plan: Pick<HallPlan, "blockW" | "rows">): V3 {
  const st = stairOf(plan);
  return [st.footX - 5, yFrontOf(plan.rows) + 4, 0];
}

/** Titik-titik rute: gerbang → lorong samping → jalur kaki baris → kursi. */
export function walkRoute(plan: Pick<HallPlan, "blockW" | "rows" | "cols" | "blockSize">, index: number): V3[] {
  const seat = seatPos(plan, index);
  const gate = gatePos(plan);
  const lane = laneStartY(seat.row) + LANE * 0.55;
  const st = stairOf(plan);
  const top = st.top;
  const sideX = -plan.blockW / 2 - SIDE / 2 - 2;
  return [
    gate,
    [gate[0], st.y, 0],
    [st.footX, st.y, 0],
    [st.edgeX, st.y, top],
    [sideX, st.y, top],
    [sideX, plan.rows * PITCH_Y + 4, top],
    [sideX, lane, rowZ(seat.row)],
    [seat.x, lane, seat.z],
    [seat.x, seat.y - 1, seat.z],
  ];
}

export function routeLength(route: V3[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
  return total;
}

export interface RoutePoint {
  x: number;
  y: number;
  z: number;
  /** arah jalan (radian pada bidang lantai) */
  heading: number;
  done: boolean;
}

/** Titik pada jarak `dist` sepanjang rute; z mengikuti tangga tribun, naik-turun mulus di antara simpul. */
export function pointOnRoute(route: V3[], dist: number): RoutePoint {
  let rest = Math.max(0, dist);
  for (let i = 1; i < route.length; i++) {
    const [ax, ay, az] = route[i - 1];
    const [bx, by, bz] = route[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (rest <= len || i === route.length - 1) {
      const t = len > 0 ? Math.min(1, rest / len) : 1;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, z: az + (bz - az) * t, heading: Math.atan2(by - ay, bx - ax), done: rest >= len && i === route.length - 1 };
    }
    rest -= len;
  }
  const last = route[route.length - 1];
  return { x: last[0], y: last[1], z: last[2], heading: 0, done: true };
}

export const WALK_SPEED = 44; // satuan dunia / detik

// ---------- Varian sosok (deterministik dari kunci) ----------
export function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const SKIN = ["#e3b88f", "#cf9a6e", "#a8744c", "#7b4e33"] as const;
export const CLOTH = ["#2f9275", "#d9f1e7", "#c9a24a", "#4f86a8", "#8fbfae", "#b9715c", "#e8e2cf", "#5b6fb0"] as const;
export const HAIR = ["#1b1410", "#2d1e14", "#3b2a1c", "#0d0d0d"] as const;
export const HEAD_KINDS = 2; // 0 rambut · 1 peci

export interface Look {
  skin: string;
  cloth: string;
  hair: string;
  accent: string;
  head: 0 | 1;
  /** fase & durasi gerak halus (detik) */
  delay: number;
  bob: number;
  face: number;
  /** hanya sebagian penonton yang sesekali menoleh ke layar (hemat animasi) */
  turner: boolean;
}

export function lookOf(key: string): Look {
  const h = hashOf(key);
  const pick = <T,>(list: readonly T[], shift: number) => list[(h >>> shift) % list.length];
  const head = ((h >>> 11) % HEAD_KINDS) as 0 | 1;
  return {
    skin: pick(SKIN, 3),
    cloth: pick(CLOTH, 7),
    hair: pick(HAIR, 13),
    accent: pick(CLOTH, 17),
    head,
    delay: -((h >>> 5) % 900) / 100,
    bob: 3.4 + ((h >>> 9) % 28) / 10,
    face: 9 + ((h >>> 15) % 14),
    turner: (h >>> 21) % 4 === 0,
  };
}

// ---------- Teks ----------
export function firstWords(nama: string, max: number): string {
  const clean = nama.replace(/\s+/g, " ").trim();
  const parts = clean.split(" ");
  let out = parts[0] ?? "";
  for (let i = 1; i < parts.length && (out + " " + parts[i]).length <= max; i++) out += " " + parts[i];
  return out.length > max ? out.slice(0, Math.max(1, max - 1)) + "…" : out;
}

/** Urutan tur sorot: berputar melewati kursi yang terisi, mulai setelah posisi terakhir. */
export function nextTour(filled: readonly number[], last: number): number | null {
  if (filled.length === 0) return null;
  const next = filled.find((i) => i > last);
  return next ?? filled[0];
}

/** Lama pengumuman di layar LED menurut panjang antrean. */
export const announceMs = (queued: number) => (queued > 4 ? 1800 : queued > 1 ? 3200 : 5200);
