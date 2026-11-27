import { wibDateStamp } from "./attendance-export";
import { ROLE_LABEL } from "./user-schema";
import { ALL_JABATAN, NO_JABATAN, type KehadiranFilter, type UserFilter, type UserRow } from "./user-row";

export type UserExportFormat = "xlsx" | "pdf";
export type UserExportScope = { kind: "all" } | { kind: "filter"; filter: UserFilter };

export const USER_EXPORT_COLUMNS = [
  { header: "No.", key: "no", width: 6 },
  { header: "Nama", key: "nama", width: 30 },
  { header: "Perwakilan daerah", key: "perwakilan_daerah", width: 26 },
  { header: "Keterangan kehadiran", key: "keterangan_kehadiran", width: 20 },
  { header: "Ukuran baju", key: "ukuran_baju", width: 12 },
] as const;

const STATUS_FILTER_LABEL: Record<UserFilter["status"], string> = {
  all: "Semua", ...ROLE_LABEL, inactive: "Nonaktif",
};
const KEHADIRAN_FILTER_LABEL: Record<KehadiranFilter, string> = {
  all: "Semua", offline: "Offline", online: "Online", none: "Belum diisi",
};
const MODE_LABEL: Record<string, string> = { offline: "Offline", online: "Online" };

export function userExportRows(users: UserRow[]) {
  return users.map(({ profile: p }, i) => ({
    no: i + 1,
    nama: p.nama || "-",
    perwakilan_daerah: p.perwakilan_daerah || "-",
    keterangan_kehadiran: p.keterangan_kehadiran ? (MODE_LABEL[p.keterangan_kehadiran] ?? p.keterangan_kehadiran) : "-",
    ukuran_baju: p.ukuran_baju || "-",
  }));
}

export function userExportScopeInfo(scope: UserExportScope): { k: string; v: string }[] {
  return [
    { k: "Cakupan", v: scope.kind === "all" ? "Semua user" : "Sesuai filter" },
    ...(scope.kind === "filter" ? [
      { k: "Status", v: STATUS_FILTER_LABEL[scope.filter.status] },
      { k: "Jabatan", v: scope.filter.jabatan === ALL_JABATAN ? "Semua Jabatan" : scope.filter.jabatan === NO_JABATAN ? "Tanpa jabatan" : scope.filter.jabatan },
      { k: "Keterangan kehadiran", v: KEHADIRAN_FILTER_LABEL[scope.filter.kehadiran ?? "all"] },
      { k: "Pencarian", v: scope.filter.q.trim() || "-" },
    ] : []),
  ];
}

export function buildUserExportFilename(scope: UserExportScope, now: Date = new Date(), format: UserExportFormat = "xlsx"): string {
  return `manajemen-user-bmh-${scope.kind === "all" ? "semua" : "sesuai-filter"}-${wibDateStamp(now)}.${format}`;
}
