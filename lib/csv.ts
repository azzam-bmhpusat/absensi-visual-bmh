import Papa from "papaparse";
import { guestRowSchema, type GuestRowInput } from "./schemas";
import { normalizeString } from "./normalize";

export interface ParsedCsvResult {
  validRows: GuestRowInput[];
  duplicatesCount: number;
  duplicatesList: {
    nama: string;
    perwakilan_daerah: string;
    reason: string;
  }[];
  invalidRows: {
    rowNumber: number;
    raw: Record<string, unknown>;
    errors: string[];
  }[];
  totalRead: number;
}

export interface ExistingGuestLookup {
  nama: string;
  perwakilan_daerah: string;
}

/**
 * Menghasilkan template CSV tamu undangan dengan UTF-8 BOM
 */
export function generateGuestCsvTemplate(): string {
  const bom = "\uFEFF";
  const header = "nama,perwakilan_daerah";
  const samples = [
    "Ahmad Dahlan,DKI Jakarta",
    "Muhammad Hasyim,Jawa Timur",
    "Abdul Karim Amrullah,Sumatera Barat",
    "Sultan Hasanuddin,Sulawesi Selatan",
  ];

  return `${bom}${header}\r\n${samples.join("\r\n")}\r\n`;
}

/**
 * Normalisasi nama header agar ramah variasi spasi / huruf besar
 */
function normalizeHeaderName(header: string): string {
  const cleaned = header.trim().toLowerCase().replace(/[\s_-]+/g, "_");
  if (cleaned === "nama" || cleaned === "nama_tamu" || cleaned === "name") {
    return "nama";
  }
  if (
    cleaned === "perwakilan_daerah" ||
    cleaned === "daerah" ||
    cleaned === "asal_daerah" ||
    cleaned === "cabang"
  ) {
    return "perwakilan_daerah";
  }
  return cleaned;
}

/**
 * Mengurai dan memvalidasi file CSV tamu undangan
 */
export function parseAndValidateGuestCsv(
  csvText: string,
  existingGuests: ExistingGuestLookup[] = []
): ParsedCsvResult {
  // Buat set untuk pencocokan cepat tamu yang sudah ada di database
  const dbExistingKeys = new Set(
    existingGuests.map(
      (g) =>
        `${normalizeString(g.nama).toLowerCase()}||${normalizeString(
          g.perwakilan_daerah
        ).toLowerCase()}`
    )
  );

  const seenInFileKeys = new Set<string>();

  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => normalizeHeaderName(header),
  });

  const validRows: GuestRowInput[] = [];
  const duplicatesList: ParsedCsvResult["duplicatesList"] = [];
  const invalidRows: ParsedCsvResult["invalidRows"] = [];

  let rowCounter = 1; // 1-indexed (setelah baris header)

  for (const rawRow of parsed.data) {
    rowCounter++;

    // Abaikan jika seluruh kolom kosong
    const values = Object.values(rawRow).map((v) =>
      typeof v === "string" ? v.trim() : ""
    );
    if (values.every((v) => v === "")) {
      continue;
    }

    const parseResult = guestRowSchema.safeParse({
      nama: rawRow.nama,
      perwakilan_daerah: rawRow.perwakilan_daerah,
    });

    if (!parseResult.success) {
      invalidRows.push({
        rowNumber: rowCounter,
        raw: rawRow,
        errors: parseResult.error.issues.map((issue) => issue.message),
      });
      continue;
    }

    const { nama, perwakilan_daerah } = parseResult.data;
    const lookupKey = `${nama.toLowerCase()}||${perwakilan_daerah.toLowerCase()}`;

    // Cek duplikasi di dalam file yang sama
    if (seenInFileKeys.has(lookupKey)) {
      duplicatesList.push({
        nama,
        perwakilan_daerah,
        reason: "Duplikat di dalam file CSV ini",
      });
      continue;
    }

    // Cek duplikasi terhadap database
    if (dbExistingKeys.has(lookupKey)) {
      duplicatesList.push({
        nama,
        perwakilan_daerah,
        reason: "Sudah terdaftar di database",
      });
      continue;
    }

    seenInFileKeys.add(lookupKey);
    validRows.push({ nama, perwakilan_daerah });
  }

  return {
    validRows,
    duplicatesCount: duplicatesList.length,
    duplicatesList,
    invalidRows,
    totalRead: parsed.data.length,
  };
}

export interface AttendanceExportItem {
  id: string;
  session_id: number;
  nama: string;
  perwakilan_daerah: string;
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
    "Perwakilan Daerah",
    "Status Kehadiran",
  ];

  const rows = attendances.map((item, index) => {
    const sessionName =
      sessionMap.get(item.session_id) || `Sesi ${item.session_id}`;
    const wibTime = formatToWibDateTime(item.checked_in_at);
    const status = item.is_walk_in ? "Tamu Baru (Walk-in)" : "Undangan Terdaftar";

    return [
      escapeCsvCell(index + 1),
      escapeCsvCell(wibTime),
      escapeCsvCell(sessionName),
      escapeCsvCell(item.nama),
      escapeCsvCell(item.perwakilan_daerah),
      escapeCsvCell(status),
    ].join(",");
  });

  return `${bom}${headers.join(",")}\r\n${rows.join("\r\n")}\r\n`;
}
