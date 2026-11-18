/**
 * Model murni untuk panel realtime di /admin/qr/live.
 * Semua angka dan teks yang tampil di figur berasal dari sini.
 * Data diambil dari SEMUA sesi yang sedang dibuka panitia (is_active), digabung.
 */

export interface LiveSessionInfo {
  id: number;
  /** "Hari 1 · Masuk Setelah Isoma" */
  label: string;
  /** "H1 Isoma" — untuk ruang sempit (layar HP, nampan tiket) */
  short: string;
}

export interface LiveSessionCount extends LiveSessionInfo {
  hadir: number;
}

export interface LiveArrival {
  id: string;
  nama: string;
  daerah: string;
  checkedInAt: string;
  sessionId: number;
  sessionLabel: string;
  sessionShort: string;
}

export interface LiveSnapshot {
  sessions: LiveSessionCount[];
  total: number;
  latest: LiveArrival[];
}

export const LATEST_LIMIT = 5;
export const NO_OPEN_SESSION = "Belum ada sesi dibuka";

export function sessionInfoOf(session: { id: number; nama: string; hari?: number | null }): LiveSessionInfo {
  const word = ["Pagi", "Isoma", "Malam"].find((w) => session.nama.toLowerCase().includes(w.toLowerCase()));
  const shortName = word ?? fitText(session.nama, 10);
  return {
    id: session.id,
    label: session.hari ? `Hari ${session.hari} · ${session.nama}` : session.nama,
    short: session.hari ? `H${session.hari} ${shortName}` : shortName,
  };
}

/** Persen hadir 0–100. Walk-in bisa membuat hadir > total, jadi dibatasi 100. */
export function percentOf(hadir: number, total: number): number {
  if (total <= 0) return hadir > 0 ? 100 : 0;
  return Math.min(100, Math.round((hadir / total) * 100));
}

/** Rasio isian 0–1 untuk bar progres. */
export function fillOf(hadir: number, total: number): number {
  return percentOf(hadir, total) / 100;
}

export function belumOf(hadir: number, total: number): number {
  return Math.max(0, total - hadir);
}

export function totalHadir(sessions: Pick<LiveSessionCount, "hadir">[]): number {
  return sessions.reduce((sum, s) => sum + s.hadir, 0);
}

/** Label sesi yang dibuka untuk header dan layar HP. */
export function openLabel(sessions: LiveSessionInfo[]): string {
  if (sessions.length === 0) return NO_OPEN_SESSION;
  if (sessions.length === 1) return sessions[0].label;
  return `${sessions.length} sesi dibuka: ${sessions.map((s) => s.short).join(", ")}`;
}

export function scanReadout({ sessions, total }: Pick<LiveSnapshot, "sessions" | "total">): string {
  if (sessions.length === 0) return NO_OPEN_SESSION;
  if (sessions.length === 1) {
    const { hadir } = sessions[0];
    return `${hadir}/${total} hadir · ${percentOf(hadir, total)}%`;
  }
  return `${totalHadir(sessions)} absen · ${sessions.length} sesi dibuka`;
}

const WIB = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function clockOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return WIB.format(date).replace(".", ":");
}

/** Memotong teks agar muat di jendela tiket/layar dengan tanda elipsis. */
export function fitText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

export function ticketReadout(latest: LiveArrival[], hasOpenSession = true): string {
  if (!hasOpenSession) return NO_OPEN_SESSION;
  const last = latest[0];
  if (!last) return "Menunggu kedatangan pertama";
  return `${fitText(last.nama, 20)} · ${clockOf(last.checkedInAt)}`;
}

/** Menambahkan kedatangan baru di depan, tanpa duplikat, maksimal LATEST_LIMIT. */
export function pushArrival(latest: LiveArrival[], arrival: LiveArrival): LiveArrival[] {
  return [arrival, ...latest.filter((item) => item.id !== arrival.id)].slice(0, LATEST_LIMIT);
}

/** Menambah 1 hadir pada sesi yang bersangkutan (absen baru lewat realtime). */
export function bumpSession(sessions: LiveSessionCount[], sessionId: number): LiveSessionCount[] {
  return sessions.map((s) => (s.id === sessionId ? { ...s, hadir: s.hadir + 1 } : s));
}
