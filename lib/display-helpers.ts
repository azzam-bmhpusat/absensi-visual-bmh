export interface SessionData {
  id: number;
  slug: string;
  nama: string;
  tanggal?: string | null;
  is_active?: boolean;
}

export interface GuestData {
  id: string;
  nama: string;
  perwakilan_daerah: string;
  created_at?: string;
}

export interface AttendanceData {
  id: string;
  session_id: number;
  guest_id?: string | null;
  nama: string;
  perwakilan_daerah: string;
  is_walk_in: boolean;
  checked_in_at: string;
}

/**
 * Menentukan tanggal WIB (Asia/Jakarta) dalam format YYYY-MM-DD
 */
export function getTodayWibDate(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Memilih sesi aktif berdasarkan parameter query `sesi` (1, 2, atau slug)
 * atau fallback ke sesi dengan tanggal WIB hari ini, dan default ke sesi 1.
 */
export function resolveActiveSession(
  sessions: SessionData[],
  querySesi?: string | string[] | null,
  todayWib: string = getTodayWibDate()
): SessionData {
  if (!sessions || sessions.length === 0) {
    return { id: 1, slug: "hari-1", nama: "Hari Pertama" };
  }

  const rawParam = Array.isArray(querySesi) ? querySesi[0] : querySesi;

  if (rawParam) {
    const trimmed = rawParam.trim().toLowerCase();
    const parsedNum = parseInt(trimmed, 10);

    const matchById = !isNaN(parsedNum)
      ? sessions.find((s) => s.id === parsedNum)
      : null;
    if (matchById) return matchById;

    const matchBySlug = sessions.find(
      (s) => s.slug.toLowerCase() === trimmed
    );
    if (matchBySlug) return matchBySlug;
  }

  // Fallback: cari sesi yang tanggalnya cocok dengan hari ini di WIB
  const matchByDate = sessions.find((s) => s.tanggal === todayWib);
  if (matchByDate) return matchByDate;

  // Fallback default: sesi 1 atau sesi pertama dalam daftar
  const defaultSession = sessions.find((s) => s.id === 1) || sessions[0];
  return defaultSession;
}

export interface DerivedAttendance {
  hadir: AttendanceData[];
  belumHadir: GuestData[];
  groupedBelumHadir: Record<string, GuestData[]> | null;
  totalGuests: number;
  hadirCount: number;
  percentage: number;
}

/**
 * Menghitung daftar hadir, belum hadir, total tamu, dan persentase
 */
export function deriveAttendanceData(
  guests: GuestData[],
  attendances: AttendanceData[],
  activeSessionId: number
): DerivedAttendance {
  // Filter hadir untuk sesi aktif, urutkan terbaru di atas (checked_in_at desc)
  const hadir = attendances
    .filter((a) => a.session_id === activeSessionId)
    .sort((a, b) => {
      const timeA = new Date(a.checked_in_at).getTime();
      const timeB = new Date(b.checked_in_at).getTime();
      return timeB - timeA;
    });

  // Himpunan guest_id yang sudah hadir
  const checkedInGuestIds = new Set(
    hadir.map((h) => h.guest_id).filter((id): id is string => Boolean(id))
  );

  // Belum hadir: tamu terdaftar yang belum hadir di sesi ini
  const belumHadir = guests
    .filter((g) => !checkedInGuestIds.has(g.id))
    .sort((a, b) => {
      const cmpDaerah = a.perwakilan_daerah.localeCompare(
        b.perwakilan_daerah,
        "id"
      );
      if (cmpDaerah !== 0) return cmpDaerah;
      return a.nama.localeCompare(b.nama, "id");
    });

  // Jika daftar belum hadir > 40, kelompokkan berdasarkan perwakilan daerah
  let groupedBelumHadir: Record<string, GuestData[]> | null = null;
  if (belumHadir.length > 40) {
    groupedBelumHadir = belumHadir.reduce((acc, guest) => {
      const daerah = guest.perwakilan_daerah || "Lainnya";
      if (!acc[daerah]) acc[daerah] = [];
      acc[daerah].push(guest);
      return acc;
    }, {} as Record<string, GuestData[]>);
  }

  const totalGuests = guests.length;
  const hadirCount = hadir.length;
  const percentage =
    totalGuests > 0 ? Math.round((hadirCount / totalGuests) * 100) : 0;

  return {
    hadir,
    belumHadir,
    groupedBelumHadir,
    totalGuests,
    hadirCount,
    percentage,
  };
}

/**
 * Format jam dalam WIB (HH:mm:ss WIB)
 */
export function formatWibClock(date = new Date()): string {
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

  return `${timeStr.replace(/\./g, ":")} WIB`;
}
