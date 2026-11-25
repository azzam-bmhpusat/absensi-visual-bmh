import "server-only";
import ExcelJS from "exceljs";
import { addTableSheet } from "./attendance-xlsx";
import { MODE_KEHADIRAN, UKURAN_BAJU } from "./participant-options";
import type { AdminProfileInput } from "./profile-contact";
import { DEFAULT_ROLE, USER_ROLES, type CreateUserInput } from "./user-schema";

// Di bawah batas body Server Action bawaan (1 MB).
export const IMPORT_MAX_BYTES = 900 * 1024;
export const IMPORT_MAX_ROWS = 500;

type ProfileKey = keyof AdminProfileInput;
type ImportKey = "email" | "password" | "role" | ProfileKey;

const COLUMNS: { header: string; key: ImportKey; width: number }[] = [
  { header: "Email", key: "email", width: 32 },
  { header: "Password", key: "password", width: 18 },
  { header: "Role", key: "role", width: 12 },
  { header: "Nama", key: "nama", width: 28 },
  { header: "Perwakilan Daerah", key: "perwakilan_daerah", width: 24 },
  { header: "Jabatan", key: "jabatan", width: 22 },
  { header: "Kategori", key: "kategori", width: 14 },
  { header: "Ukuran Baju", key: "ukuran_baju", width: 12 },
  { header: "No. WhatsApp", key: "no_whatsapp", width: 18 },
  { header: "Rencana Kedatangan", key: "rencana_kedatangan", width: 22 },
  { header: "Keterangan Kehadiran", key: "keterangan_kehadiran", width: 22 },
];

const PROFILE_KEYS = COLUMNS.map((c) => c.key).filter(
  (k): k is ProfileKey => k !== "email" && k !== "password" && k !== "role"
);

const normHeader = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export interface ImportRow {
  rowNumber: number;
  input: CreateUserInput;
  profile: Partial<AdminProfileInput>;
}

export async function buildUserImportTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Absensi BMH";

  const ws = addTableSheet(wb, "Template", COLUMNS, [
    {
      email: "peserta@contoh.com",
      password: "RahasiaKuat123",
      role: "peserta",
      nama: "Ahmad Fauzi",
      perwakilan_daerah: "Jawa Barat",
      jabatan: "Kepala Cabang",
      kategori: "",
      ukuran_baju: "L",
      no_whatsapp: "081234567890",
      rencana_kedatangan: "2026-11-20 14:00",
      keterangan_kehadiran: "offline",
    },
  ]);

  const col = (key: ImportKey) => COLUMNS.findIndex((c) => c.key === key) + 1;
  // Teks agar angka 0 di depan dan format tanggal tidak diubah Excel.
  for (const key of ["no_whatsapp", "rencana_kedatangan", "password"] as const) ws.getColumn(col(key)).numFmt = "@";
  const lists: [ImportKey, readonly string[]][] = [
    ["role", USER_ROLES],
    ["ukuran_baju", UKURAN_BAJU],
    ["keterangan_kehadiran", MODE_KEHADIRAN],
  ];
  for (const [key, values] of lists) {
    for (let r = 2; r <= IMPORT_MAX_ROWS + 1; r++) {
      ws.getCell(r, col(key)).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${values.join(",")}"`],
      };
    }
  }

  addTableSheet(
    wb,
    "Petunjuk",
    [
      { header: "Kolom", key: "k", width: 24 },
      { header: "Keterangan", key: "v", width: 80 },
    ],
    [
      { k: "Email", v: "Wajib. Harus unik dan belum terdaftar." },
      { k: "Password", v: "Wajib. 8–72 karakter. Bagikan ke pengguna setelah impor." },
      { k: "Role", v: `Opsional: ${USER_ROLES.join(" / ")}. Kosong = ${DEFAULT_ROLE}.` },
      { k: "Nama, Perwakilan Daerah, Jabatan", v: "Opsional, 2–100 karakter." },
      { k: "Kategori", v: "Opsional, maksimal 100 karakter." },
      { k: "Ukuran Baju", v: `Opsional: ${UKURAN_BAJU.join(" / ")}.` },
      { k: "No. WhatsApp", v: "Opsional, 8–15 digit (contoh 081234567890)." },
      { k: "Rencana Kedatangan", v: "Opsional, format YYYY-MM-DD HH:mm (WIB), contoh 2026-11-20 14:00." },
      { k: "Keterangan Kehadiran", v: `Opsional: ${MODE_KEHADIRAN.join(" / ")}.` },
      { k: "Catatan", v: `Hapus baris contoh sebelum impor. Maksimal ${IMPORT_MAX_ROWS} baris per file.` },
    ]
  );

  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data as ArrayBuffer);
}

/** Nilai sel -> teks. Tanggal Excel dianggap jam dinding (WIB) -> "YYYY-MM-DDTHH:mm". */
function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 16);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((t) => t.text).join("").trim();
    if ("text" in value) return String(value.text).trim();
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    return "";
  }
  return String(value).trim();
}

export type ParseResult = { ok: true; rows: ImportRow[] } | { ok: false; error: string };

export async function parseUserImportWorkbook(buffer: ArrayBuffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    return { ok: false, error: "File tidak dapat dibaca. Pastikan formatnya .xlsx." };
  }
  const ws = wb.worksheets[0];
  if (!ws) return { ok: false, error: "File tidak berisi sheet." };

  const colOf = new Map<ImportKey, number>();
  ws.getRow(1).eachCell((cell, colNumber) => {
    const h = normHeader(cellText(cell.value));
    const match = COLUMNS.find((c) => normHeader(c.header) === h);
    if (match && !colOf.has(match.key)) colOf.set(match.key, colNumber);
  });
  if (!colOf.has("email") || !colOf.has("password")) {
    return { ok: false, error: "Kolom Email dan Password wajib ada. Gunakan template impor." };
  }

  const rows: ImportRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (key: ImportKey) => {
      const c = colOf.get(key);
      return c ? cellText(row.getCell(c).value) : "";
    };
    const values = COLUMNS.map((c) => get(c.key));
    if (values.every((v) => !v)) continue;
    if (rows.length >= IMPORT_MAX_ROWS) {
      return { ok: false, error: `Maksimal ${IMPORT_MAX_ROWS} baris per file.` };
    }

    const profile: Partial<AdminProfileInput> = {};
    for (const key of PROFILE_KEYS) {
      if (!colOf.has(key)) continue;
      let v = get(key);
      if (key === "rencana_kedatangan") v = v.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/, "$1T$2");
      if (key === "ukuran_baju") v = v.toUpperCase();
      if (key === "keterangan_kehadiran") v = v.toLowerCase();
      profile[key] = v;
    }
    rows.push({
      rowNumber: r,
      input: {
        email: get("email"),
        password: get("password"),
        role: (get("role").toLowerCase() || DEFAULT_ROLE) as CreateUserInput["role"],
      },
      profile,
    });
  }
  if (rows.length === 0) return { ok: false, error: "Tidak ada data user di file." };
  return { ok: true, rows };
}
