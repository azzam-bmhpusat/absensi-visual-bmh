export interface AttendanceExportItem {
  id: string;
  session_id: number;
  nama: string;
  perwakilan_daerah: string;
  jabatan?: string | null;
  kategori?: string | null;
  is_walk_in: boolean;
  checked_in_at: string;
}

export interface SessionInfo {
  id: number;
  nama: string;
  hari?: number;
}

/**
 * Format tanggal dan waktu ISO ke format WIB (Asia/Jakarta)
 */
export function formatToWibDateTime(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;

    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return `${formatter.format(date).replace(/\./g, ":")} WIB`;
  } catch {
    return isoDateString;
  }
}

/**
 * Escape teks untuk CSV standar
 */
function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Menghasilkan CSV rekap presensi dengan format UTF-8 BOM agar terbaca benar di Excel
 */
export function exportAttendanceToCsv(
  attendances: AttendanceExportItem[],
  sessions: SessionInfo[] = []
): string {
  const sessionMap = new Map<number, string>(
    sessions.map((s) => [s.id, s.nama])
  );

  const bom = "\uFEFF";
  const headers = [
    "No",
    "Waktu Presensi (WIB)",
    "Sesi",
    "Nama Tamu",
    "Perwakilan Daerah / Asal",
    "Jabatan",
    "Status Kehadiran",
  ];

  const rows = attendances.map((item, index) => {
    const sessionName =
      sessionMap.get(item.session_id) || `Sesi ${item.session_id}`;
    const wibTime = formatToWibDateTime(item.checked_in_at);
    const status = item.is_walk_in ? "Tamu Baru (Walk-in)" : "Undangan Terdaftar";
    const affiliationRole = item.jabatan?.trim() || "-";

    return [
      escapeCsvCell(index + 1),
      escapeCsvCell(wibTime),
      escapeCsvCell(sessionName),
      escapeCsvCell(item.nama),
      escapeCsvCell(item.perwakilan_daerah),
      escapeCsvCell(affiliationRole),
      escapeCsvCell(status),
    ].join(",");
  });

  return `${bom}${headers.join(",")}\r\n${rows.join("\r\n")}\r\n`;
}
