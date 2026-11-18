import { describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";

vi.mock("server-only", () => ({}));

import {
  buildExportFilename,
  buildSessionSummary,
  filterAttendances,
  getAbsentGuests,
  safeSheetName,
  sessionLabel,
  toWibExcelDate,
  type ExportAttendance,
  type ExportGuest,
  type ExportSession,
} from "@/lib/attendance-export";
import { buildAttendanceWorkbook } from "@/lib/attendance-xlsx";

const sessions: ExportSession[] = [
  { id: 1, nama: "Pagi", hari: 1 },
  { id: 2, nama: "Isoma", hari: 1 },
  { id: 4, nama: "Pagi", hari: 2 },
];

const guests: ExportGuest[] = [
  { id: "g1", nama: "Ahmad", perwakilan_daerah: "Jawa Timur", kategori: "daerah" },
  { id: "g2", nama: "Budi", perwakilan_daerah: "DKI Jakarta", jabatan: "Ketua", kategori: "daerah" },
  { id: "g3", nama: "Citra", perwakilan_daerah: "Pusat", departemen: "IT", kategori: "departemen" },
];

const attendances: ExportAttendance[] = [
  { id: "a1", session_id: 1, guest_id: "g1", nama: "Ahmad", perwakilan_daerah: "Jawa Timur", is_walk_in: false, checked_in_at: "2026-11-13T01:30:00Z" },
  // Tanpa guest_id tapi nama + daerah cocok (beda spasi/kapital) → dihitung hadir
  { id: "a2", session_id: 1, guest_id: null, nama: "  budi ", perwakilan_daerah: "dki  jakarta", is_walk_in: false, checked_in_at: "2026-11-13T01:00:00Z" },
  { id: "a3", session_id: 1, guest_id: null, nama: "Tamu Baru", perwakilan_daerah: "Bali", is_walk_in: true, checked_in_at: "2026-11-13T02:00:00Z" },
  { id: "a4", session_id: 4, guest_id: "g3", nama: "Citra", perwakilan_daerah: "Pusat", departemen: "IT", is_walk_in: false, checked_in_at: "2026-11-14T01:00:00Z" },
];

describe("attendance-export helpers", () => {
  it("menghitung tamu belum hadir per sesi via guest_id atau nama+daerah", () => {
    const absent = getAbsentGuests(guests, attendances.filter((a) => a.session_id === 1));
    expect(absent.map((g) => g.id)).toEqual(["g3"]);
  });

  it("membuat ringkasan sesi", () => {
    const s = buildSessionSummary(sessions[0], attendances.filter((a) => a.session_id === 1), guests);
    expect(s).toMatchObject({ hadir: 3, terdaftar: 2, walkIn: 1, undangan: 3, undanganHadir: 2, belumHadir: 1, persenKehadiran: 66.7 });
  });

  it("filter mengikuti hari, sesi, daerah, dan pencarian", () => {
    expect(filterAttendances(attendances, sessions, { hari: 2 }).map((a) => a.id)).toEqual(["a4"]);
    expect(filterAttendances(attendances, sessions, { sessionId: 1, q: "baru" }).map((a) => a.id)).toEqual(["a3"]);
    expect(filterAttendances(attendances, sessions, { daerah: "Pusat" }).map((a) => a.id)).toEqual(["a4"]);
    expect(filterAttendances(attendances, sessions, { q: "it" }).map((a) => a.id)).toEqual(["a4"]);
  });

  it("nama sheet aman dan unik", () => {
    const used = new Set<string>();
    expect(safeSheetName("H1 S1 - Pagi: [Absen]/Masuk*?", used)).toBe("H1 S1 - Pagi Absen Masuk");
    expect(safeSheetName("x".repeat(40), used)).toHaveLength(31);
    expect(safeSheetName("x".repeat(40), used)).toBe(`${"x".repeat(27)} (2)`);
    expect(safeSheetName("", used)).toBe("Sheet");
  });

  it("menggeser waktu ke jam dinding WIB", () => {
    expect(toWibExcelDate("2026-11-13T01:30:00Z")?.toISOString()).toBe("2026-11-13T08:30:00.000Z");
    expect(toWibExcelDate("bukan tanggal")).toBeNull();
  });

  it("label sesi dan nama file", () => {
    expect(sessionLabel(sessions[1])).toBe("Hari 1 – Sesi 2: Isoma");
    const now = new Date("2026-11-13T20:00:00Z"); // 14 Nov WIB
    expect(buildExportFilename({ kind: "all" }, now)).toBe("rekap-kehadiran-bmh-semua-sesi-2026-11-14.xlsx");
    expect(buildExportFilename({ kind: "session", sessionId: 4 }, now)).toBe("rekap-kehadiran-bmh-sesi-4-2026-11-14.xlsx");
    expect(buildExportFilename({ kind: "filter", filter: {} }, now)).toBe("rekap-kehadiran-bmh-sesuai-filter-2026-11-14.xlsx");
  });
});

async function readBack(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

describe("buildAttendanceWorkbook", () => {
  const generatedAt = new Date("2026-11-13T05:00:00Z");

  it("ekspor per sesi: Ringkasan, Hadir, Belum Hadir", async () => {
    const wb = await readBack(
      await buildAttendanceWorkbook({ scope: { kind: "session", sessionId: 1 }, sessions, attendances, guests, generatedAt })
    );
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Ringkasan", "Hadir", "Belum Hadir"]);

    const hadir = wb.getWorksheet("Hadir")!;
    expect(hadir.getRow(1).values).toEqual([
      undefined, "No", "Waktu Presensi (WIB)", "Nama", "Perwakilan Daerah", "Jabatan", "Departemen", "Kategori", "Status",
    ]);
    expect(hadir.rowCount).toBe(4);
    // Diurutkan dari presensi paling awal; waktu tersimpan sebagai tanggal WIB
    expect(hadir.getCell("C2").value).toBe("  budi ");
    expect((hadir.getCell("B2").value as Date).toISOString()).toBe("2026-11-13T08:00:00.000Z");
    expect(hadir.getCell("H4").value).toBe("Walk-in");

    const belum = wb.getWorksheet("Belum Hadir")!;
    expect(belum.rowCount).toBe(2);
    expect(belum.getCell("B2").value).toBe("Citra");
  });

  it("ekspor semua sesi: ringkasan + sheet per sesi + matriks undangan", async () => {
    const wb = await readBack(
      await buildAttendanceWorkbook({ scope: { kind: "all" }, sessions, attendances, guests, generatedAt })
    );
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      "Ringkasan", "H1 S1 - Pagi", "H1 S2 - Isoma", "H2 S1 - Pagi", "Matriks Undangan",
    ]);
    const ringkasan = wb.getWorksheet("Ringkasan")!;
    expect(ringkasan.getCell("C2").value).toBe(3);
    expect(ringkasan.getCell("C5").value).toBe(4); // baris Total

    const matrix = wb.getWorksheet("Matriks Undangan")!;
    const citra = matrix.getRows(2, 3)!.find((r) => r.getCell(2).value === "Citra")!;
    // Kolom sesi: G (sesi 1), H (sesi 2), I (sesi 4), J total
    expect([citra.getCell(7).value, citra.getCell(8).value, citra.getCell(9).value, citra.getCell(10).value]).toEqual(["-", "-", "Hadir", 1]);
  });

  it("ekspor sesuai filter: info filter + hadir dengan kolom hari/sesi", async () => {
    const wb = await readBack(
      await buildAttendanceWorkbook({ scope: { kind: "filter", filter: { daerah: "Pusat" } }, sessions, attendances, guests: [], generatedAt })
    );
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Info Filter", "Hadir"]);
    const hadir = wb.getWorksheet("Hadir")!;
    expect(hadir.rowCount).toBe(2);
    expect(hadir.getCell("D2").value).toBe("Sesi 1: Pagi");
    expect(hadir.getCell("C2").value).toBe(2);
  });

  it("menolak sesi yang tidak ada", async () => {
    await expect(
      buildAttendanceWorkbook({ scope: { kind: "session", sessionId: 99 }, sessions, attendances, guests })
    ).rejects.toThrow("tidak ditemukan");
  });
});
