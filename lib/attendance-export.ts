import { normalizeCompare } from "./normalize";

/**
 * Fungsi murni untuk rekap & ekspor kehadiran (tanpa I/O).
 * Dipakai oleh route handler ekspor Excel dan tabel rekap di klien.
 */

export interface ExportSession {
  id: number;
  nama: string;
  hari?: number | null;
}

export interface ExportAttendance {
  id: string;
  session_id: number;
  guest_id?: string | null;
  nama: string;
  perwakilan_daerah: string;
  jabatan?: string | null;
  kategori?: string | null;
  is_walk_in: boolean;
  checked_in_at: string;
}

export interface ExportGuest {
  id: string;
  nama: string;
  perwakilan_daerah: string;
  jabatan?: string | null;
  kategori?: string | null;
}

export interface AttendanceFilter {
  hari?: number | null;
  sessionId?: number | null;
  daerah?: string | null;
  q?: string | null;
}

export interface SessionSummary {
  session: ExportSession;
  hari: number;
  label: string;
  hadir: number;
  terdaftar: number;
  walkIn: number;
  undangan: number;
  undanganHadir: number;
  belumHadir: number;
  /** Persentase undangan yang hadir (0–100, dibulatkan 1 desimal). */
  persenKehadiran: number;
}

/** Hari acara (1–3) untuk sesi; fallback dari id sesi (3 sesi per hari). */
export function resolveSessionHari(session: Pick<ExportSession, "id" | "hari">): number {
  return session.hari ?? (session.id <= 3 ? 1 : session.id <= 6 ? 2 : 3);
}

/** Urutan sesi di dalam satu hari (1–3). */
export function sessionLocalOrder(sessionId: number): number {
  return ((sessionId - 1) % 3) + 1;
}

/** Label panjang sesi, mis. "Hari 1 – Sesi 2: Isoma". */
export function sessionLabel(session: ExportSession): string {
  return `Hari ${resolveSessionHari(session)} – Sesi ${sessionLocalOrder(session.id)}: ${session.nama}`;
}

/** Kunci pencocokan orang: nama + daerah ternormalisasi (sama dengan unique index DB). */
export function personKey(nama: string, perwakilanDaerah: string): string {
  return `${normalizeCompare(nama)}||${normalizeCompare(perwakilanDaerah)}`;
}

/** Filter kehadiran dengan semantik yang sama seperti filter di tabel rekap. */
export function filterAttendances<T extends ExportAttendance>(
  attendances: T[],
  sessions: ExportSession[],
  filter: AttendanceFilter
): T[] {
  const hariBySession = new Map(sessions.map((s) => [s.id, resolveSessionHari(s)]));
  const q = filter.q?.trim().toLowerCase() ?? "";

  return attendances.filter((item) => {
    const hari = hariBySession.get(item.session_id) ?? resolveSessionHari({ id: item.session_id });
    if (filter.hari && hari !== filter.hari) return false;
    if (filter.sessionId && item.session_id !== filter.sessionId) return false;
    if (filter.daerah && item.perwakilan_daerah !== filter.daerah) return false;
    if (q) {
      const match =
        item.nama.toLowerCase().includes(q) ||
        item.perwakilan_daerah.toLowerCase().includes(q) ||
        Boolean(item.jabatan?.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
}

/** Apakah tamu undangan tercatat hadir (cocok guest_id, atau fallback nama + daerah). */
function buildPresenceLookup(attendances: ExportAttendance[]) {
  const guestIds = new Set<string>();
  const keys = new Set<string>();
  for (const a of attendances) {
    if (a.guest_id) guestIds.add(a.guest_id);
    keys.add(personKey(a.nama, a.perwakilan_daerah));
  }
  return (guest: ExportGuest) =>
    guestIds.has(guest.id) || keys.has(personKey(guest.nama, guest.perwakilan_daerah));
}

/** Tamu undangan yang belum hadir di sesi tertentu (diurutkan daerah lalu nama). */
export function getAbsentGuests(
  guests: ExportGuest[],
  sessionAttendances: ExportAttendance[]
): ExportGuest[] {
  const isPresent = buildPresenceLookup(sessionAttendances);
  return sortGuests(guests.filter((g) => !isPresent(g)));
}

export function sortGuests<T extends ExportGuest>(guests: T[]): T[] {
  return [...guests].sort(
    (a, b) =>
      a.perwakilan_daerah.localeCompare(b.perwakilan_daerah, "id") ||
      a.nama.localeCompare(b.nama, "id")
  );
}

/** Kehadiran diurutkan dari yang paling awal presensi. */
export function sortByCheckIn<T extends ExportAttendance>(attendances: T[]): T[] {
  return [...attendances].sort(
    (a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()
  );
}

export function buildSessionSummary(
  session: ExportSession,
  sessionAttendances: ExportAttendance[],
  guests: ExportGuest[]
): SessionSummary {
  const isPresent = buildPresenceLookup(sessionAttendances);
  const undanganHadir = guests.filter(isPresent).length;
  const walkIn = sessionAttendances.filter((a) => a.is_walk_in).length;
  const undangan = guests.length;
  return {
    session,
    hari: resolveSessionHari(session),
    label: sessionLabel(session),
    hadir: sessionAttendances.length,
    terdaftar: sessionAttendances.length - walkIn,
    walkIn,
    undangan,
    undanganHadir,
    belumHadir: undangan - undanganHadir,
    persenKehadiran: undangan === 0 ? 0 : Math.round((undanganHadir / undangan) * 1000) / 10,
  };
}

/** Kelompokkan kehadiran per session_id. */
export function groupBySession<T extends ExportAttendance>(attendances: T[]): Map<number, T[]> {
  const grouped = new Map<number, T[]>();
  for (const a of attendances) {
    const list = grouped.get(a.session_id);
    if (list) list.push(a);
    else grouped.set(a.session_id, [a]);
  }
  return grouped;
}

const INVALID_SHEET_CHARS = /[[\]:*?/\\]/g;

/** Nama sheet Excel yang valid (≤31 karakter, tanpa []:*?/\, unik case-insensitive). */
export function safeSheetName(name: string, used: Set<string>): string {
  const base =
    name.replace(INVALID_SHEET_CHARS, " ").replace(/\s+/g, " ").trim().replace(/^'+|'+$/g, "").slice(0, 31).trim() ||
    "Sheet";
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n++})`;
    candidate = `${base.slice(0, 31 - suffix.length).trim()}${suffix}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Excel tidak menyimpan zona waktu. Kembalikan Date yang komponen UTC-nya
 * sama dengan jam dinding WIB, supaya sel tanggal tampil dalam WIB.
 */
export function toWibExcelDate(iso: string): Date | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + WIB_OFFSET_MS);
}

/** Tanggal hari ini (WIB) dalam format YYYY-MM-DD. */
export function wibDateStamp(now: Date = new Date()): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export function statusLabel(isWalkIn: boolean): string {
  return isWalkIn ? "Walk-in" : "Terdaftar";
}

export function kategoriLabel(kategori?: string | null): string {
  if (!kategori) return "-";
  return kategori.charAt(0).toUpperCase() + kategori.slice(1);
}

export type ExportScope =
  | { kind: "all" }
  | { kind: "session"; sessionId: number }
  | { kind: "filter"; filter: AttendanceFilter };

export function buildExportFilename(scope: ExportScope, now: Date = new Date()): string {
  const part =
    scope.kind === "all"
      ? "semua-sesi"
      : scope.kind === "session"
        ? `sesi-${scope.sessionId}`
        : "sesuai-filter";
  return `rekap-kehadiran-bmh-${part}-${wibDateStamp(now)}.xlsx`;
}

/** Frasa yang wajib diketik admin sebelum menghapus SEMUA data kehadiran. */
export const DELETE_ALL_CONFIRM_PHRASE = "HAPUS SEMUA";
