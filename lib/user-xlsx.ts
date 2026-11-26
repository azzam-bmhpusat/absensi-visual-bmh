import "server-only";
import ExcelJS from "exceljs";
import { addTableSheet, type Column } from "./attendance-xlsx";
import { safeSheetName, toWibExcelDate, wibDateStamp } from "./attendance-export";
import { ROLE_LABEL } from "./user-schema";
import { ALL_JABATAN, NO_JABATAN, type KehadiranFilter, type UserFilter, type UserRow } from "./user-row";

const DATE_FORMAT = "dd/mm/yyyy hh:mm";

export type UserExportScope = { kind: "all" } | { kind: "filter"; filter: UserFilter };

const STATUS_FILTER_LABEL: Record<UserFilter["status"], string> = {
  all: "Semua",
  ...ROLE_LABEL,
  inactive: "Nonaktif",
};

const columns: Column[] = [
  { header: "No.", key: "no", width: 6 },
  { header: "Nama", key: "nama", width: 30 },
  { header: "Perwakilan daerah", key: "perwakilan_daerah", width: 26 },
  { header: "Keterangan kehadiran", key: "keterangan_kehadiran", width: 20 },
  { header: "Ukuran baju", key: "ukuran_baju", width: 12 },
];

const MODE_LABEL: Record<string, string> = { offline: "Offline", online: "Online" };

const KEHADIRAN_FILTER_LABEL: Record<KehadiranFilter, string> = {
  all: "Semua",
  offline: "Offline",
  online: "Online",
  none: "Belum diisi",
};

const dash = (v: string | null) => v || "-";

function userRows(users: UserRow[]) {
  return users.map((u, i) => {
    const p = u.profile;
    const mode = p.keterangan_kehadiran;
    return {
      no: i + 1,
      nama: dash(p.nama),
      perwakilan_daerah: dash(p.perwakilan_daerah),
      keterangan_kehadiran: mode ? (MODE_LABEL[mode] ?? mode) : "-",
      ukuran_baju: dash(p.ukuran_baju),
    };
  });
}

function jabatanLabel(jabatan: string): string {
  if (jabatan === ALL_JABATAN) return "Semua Jabatan";
  if (jabatan === NO_JABATAN) return "Tanpa jabatan";
  return jabatan;
}

export function buildUserExportFilename(scope: UserExportScope, now: Date = new Date()): string {
  return `manajemen-user-bmh-${scope.kind === "all" ? "semua" : "sesuai-filter"}-${wibDateStamp(now)}.xlsx`;
}

/** `users` harus sudah difilter sesuai scope. */
export async function buildUserWorkbook(
  scope: UserExportScope,
  users: UserRow[],
  generatedAt: Date = new Date()
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Absensi BMH";
  wb.created = generatedAt;
  const used = new Set<string>();

  addTableSheet(wb, safeSheetName("User", used), columns, userRows(users));

  const info = addTableSheet(
    wb,
    safeSheetName("Info Ekspor", used),
    [
      { header: "Keterangan", key: "k", width: 18 },
      { header: "Nilai", key: "v", width: 48 },
    ],
    [
      { k: "Cakupan", v: scope.kind === "all" ? "Semua user" : "Sesuai filter" },
      ...(scope.kind === "filter"
        ? [
            { k: "Status", v: STATUS_FILTER_LABEL[scope.filter.status] },
            { k: "Jabatan", v: jabatanLabel(scope.filter.jabatan) },
            { k: "Keterangan kehadiran", v: KEHADIRAN_FILTER_LABEL[scope.filter.kehadiran ?? "all"] },
            { k: "Pencarian", v: scope.filter.q.trim() || "-" },
          ]
        : []),
      { k: "Jumlah User", v: users.length },
      { k: "Diekspor", v: toWibExcelDate(generatedAt.toISOString()) },
    ]
  );
  const stamp = info.getCell(`B${info.rowCount}`);
  stamp.numFmt = `${DATE_FORMAT} "WIB"`;
  stamp.alignment = { horizontal: "left" };

  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data as ArrayBuffer);
}
