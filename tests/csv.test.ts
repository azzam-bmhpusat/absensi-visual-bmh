import { describe, it, expect } from "vitest";
import {
  exportAttendanceToCsv,
  formatToWibDateTime,
} from "../lib/csv";

describe("CSV Utilities", () => {
  describe("exportAttendanceToCsv", () => {
    it("menghasilkan CSV dengan BOM UTF-8 dan format WIB", () => {
      const attendances = [
        {
          id: "1",
          session_id: 1,
          nama: "Budi Santoso, Ir.",
          perwakilan_daerah: "Jawa Timur",
          is_walk_in: false,
          checked_in_at: "2026-11-13T03:30:00.000Z", // 10:30 WIB (UTC+7)
        },
        {
          id: "2",
          session_id: 2,
          nama: "Dewi Sartika",
          perwakilan_daerah: "Jawa Barat",
          is_walk_in: true,
          checked_in_at: "2026-11-14T07:15:00.000Z", // 14:15 WIB
        },
      ];

      const sessions = [
        { id: 1, nama: "Hari Pertama" },
        { id: 2, nama: "Hari Kedua" },
      ];

      const csv = exportAttendanceToCsv(attendances, sessions);

      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("No,Waktu Presensi (WIB),Sesi,Nama Tamu,Perwakilan Daerah / Asal,Jabatan / Departemen,Status Kehadiran");
      // Cek quoting koma pada nama
      expect(csv).toContain('"Budi Santoso, Ir."');
      expect(csv).toContain("Hari Pertama");
      expect(csv).toContain("Undangan Terdaftar");
      expect(csv).toContain("Tamu Baru (Walk-in)");
      expect(csv).toContain("10:30:00 WIB");
      expect(csv).toContain("14:15:00 WIB");
    });

    it("mengekspor jabatan dan departemen tamu ke dalam CSV dengan benar", () => {
      const attendances = [
        {
          id: "3",
          session_id: 1,
          nama: "Fulan",
          perwakilan_daerah: "Pusat",
          jabatan: "Ketua Departemen",
          departemen: "IT",
          is_walk_in: false,
          checked_in_at: "2026-11-13T03:30:00.000Z",
        },
      ];
      const csv = exportAttendanceToCsv(attendances);
      expect(csv).toContain("Ketua Departemen: IT");
      expect(csv).toContain("Fulan");
    });
  });

  describe("formatToWibDateTime", () => {
    it("mengonversi UTC ISO string ke format WIB", () => {
      const formatted = formatToWibDateTime("2026-11-13T01:00:00.000Z"); // 08:00 WIB
      expect(formatted).toContain("08:00:00 WIB");
      expect(formatted).toContain("13/11/2026");
    });
  });
});
