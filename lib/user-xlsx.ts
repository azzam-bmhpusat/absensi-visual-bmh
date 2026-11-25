import "server-only";
import ExcelJS from "exceljs";
import { addTableSheet, type Column } from "./attendance-xlsx";
import { kategoriLabel, safeSheetName, toWibExcelDate, wibDateStamp } from "./attendance-export";
import { MODE_KEHADIRAN_LABEL, type MODE_KEHADIRAN } from "./participant-options";
import { formatArrival, isProfileComplete } from "./profile-contact";
import { ROLE_LABEL } from "./user-schema";
import { ALL_JABATAN, NO_JABATAN, type UserFilter, type UserRow } from "./user-row";

const DATE_FORMAT = "dd/mm/yyyy hh:mm";

export type UserExportScope = { kind: "all" } | { kind: "filter"; filter: UserFilter };

const STATUS_FILTER_LABEL: Record<UserFilter["status"], string> = {
  all: "Semua",
  ...ROLE_LABEL,
  inactive: "Nonaktif",
};

const columns: Column[] = [
  { header: "No", key: "no", width: 6 },
  { header: "Email", key: "email", width: 32 },
  { header: "Role", key: "role", width: 10 },
  { header: "Status Akun", key: "status", width: 12 },
  { header: "Nama", key: "nama", width: 30 },
  { header: "Perwakilan Daerah", key: "perwakilan_daerah", width: 26 },
  { header: "Jabatan", key: "jabatan", width: 24 },
  { header: "Kategori", key: "kategori", width: 12 },
  { header: "Ukuran Baju", key: "ukuran_baju", width: 12 },
  { header: "No. WhatsApp", key: "no_whatsapp", width: 18 },
  { header: "Rencana Kedatangan", key: "rencana_kedatangan", width: 36 },
  { header: "Mode Kehadiran", key: "mode_kehadiran", width: 24 },
  { header: "Keterangan Kehadiran", key: "keterangan_kehadiran", width: 30 },
  { header: "Profil Lengkap", key: "lengkap", width: 14 },
  { header: "Login Terakhir (WIB)", key: "last_sign_in", width: 20, numFmt: DATE_FORMAT },
  { header: "Dibuat (WIB)", key: "created", width: 20, numFmt: DATE_FORMAT },
];

const dash = (v: string | null) => v || "-";

function userRows(users: UserRow[]) {
  return users.map((u, i) => {
    const p = u.profile;
    const mode = p.mode_kehadiran as (typeof MODE_KEHADIRAN)[number] | null;
    return {
      no: i + 1,
      email: u.email,
      role: ROLE_LABEL[u.role],
      status: u.banned ? "Nonaktif" : "Aktif",
      nama: dash(p.nama),
      perwakilan_daerah: dash(p.perwakilan_daerah),
      jabatan: dash(p.jabatan),
      kategori: kategoriLabel(p.kategori),
      ukuran_baju: dash(p.ukuran_baju),
      // Disimpan sebagai teks agar angka 0 di depan tidak hilang di Excel.
      no_whatsapp: dash(p.no_whatsapp),
      rencana_kedatangan: formatArrival(p.rencana_kedatangan) ?? "-",
      mode_kehadiran: mode ? (MODE_KEHADIRAN_LABEL[mode] ?? mode) : "-",
      keterangan_kehadiran: dash(p.keterangan_kehadiran),
      lengkap: isProfileComplete(p) ? "Ya" : "Belum",
      last_sign_in: u.lastSignInAt ? (toWibExcelDate(u.lastSignInAt) ?? "-") : "Belum pernah",
      created: toWibExcelDate(u.createdAt) ?? u.createdAt,
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
