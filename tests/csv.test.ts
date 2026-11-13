import { describe, it, expect } from "vitest";
import {
  generateGuestCsvTemplate,
  parseAndValidateGuestCsv,
  exportAttendanceToCsv,
  formatToWibDateTime,
} from "../lib/csv";

describe("CSV Utilities", () => {
  describe("generateGuestCsvTemplate", () => {
    it("menghasilkan template dengan UTF-8 BOM dan header yang benar", () => {
      const template = generateGuestCsvTemplate();
      expect(template.startsWith("\uFEFF")).toBe(true);
      expect(template).toContain("nama,perwakilan_daerah");
      expect(template).toContain("Ahmad Dahlan,DKI Jakarta");
    });
  });

  describe("parseAndValidateGuestCsv", () => {
    it("berhasil memparsing baris yang valid", () => {
      const csv = `nama,perwakilan_daerah\nBudi Santoso,Surabaya\nDewi Sartika,Bandung`;
      const result = parseAndValidateGuestCsv(csv);

      expect(result.validRows).toHaveLength(2);
      expect(result.validRows[0]).toEqual({
        nama: "Budi Santoso",
        perwakilan_daerah: "Surabaya",
      });
      expect(result.validRows[1]).toEqual({
        nama: "Dewi Sartika",
        perwakilan_daerah: "Bandung",
      });
      expect(result.duplicatesCount).toBe(0);
      expect(result.invalidRows).toHaveLength(0);
    });

    it("menangani variasi penulisan header dan spasi", () => {
      const csv = ` Nama Tamu , Daerah \n   Ahmad Fulan   ,   DKI Jakarta   `;
      const result = parseAndValidateGuestCsv(csv);

      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0]).toEqual({
        nama: "Ahmad Fulan",
        perwakilan_daerah: "DKI Jakarta",
      });
    });

    it("mendeteksi duplikat dalam file CSV yang sama", () => {
      const csv = `nama,perwakilan_daerah
Budi Santoso,Surabaya
budi santoso,surabaya
Budi Santoso,Semarang`;
      const result = parseAndValidateGuestCsv(csv);

      expect(result.validRows).toHaveLength(2);
      expect(result.duplicatesCount).toBe(1);
      expect(result.duplicatesList[0].nama).toBe("budi santoso");
      expect(result.duplicatesList[0].reason).toContain("di dalam file");
    });

    it("mendeteksi duplikat terhadap data yang sudah ada di database", () => {
      const existing = [
        { nama: "Ahmad Yani", perwakilan_daerah: "Jakarta Pusat" },
      ];
      const csv = `nama,perwakilan_daerah
Ahmad Yani,Jakarta Pusat
Umar Wirahadikusumah,Bandung`;

      const result = parseAndValidateGuestCsv(csv, existing);

      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].nama).toBe("Umar Wirahadikusumah");
      expect(result.duplicatesCount).toBe(1);
      expect(result.duplicatesList[0].nama).toBe("Ahmad Yani");
      expect(result.duplicatesList[0].reason).toContain("database");
    });

    it("mencatat baris tidak valid jika field kosong atau tidak memenuhi syarat zod", () => {
      const csv = `nama,perwakilan_daerah
A,Surabaya
Budi Santoso,
,Jakarta
Valid Name,Valid Area`;

      const result = parseAndValidateGuestCsv(csv);

      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].nama).toBe("Valid Name");
      expect(result.invalidRows.length).toBeGreaterThanOrEqual(3);
    });
  });

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
      expect(csv).toContain("No,Waktu Presensi (WIB),Sesi,Nama Tamu,Perwakilan Daerah,Status Kehadiran");
      // Cek quoting koma pada nama
      expect(csv).toContain('"Budi Santoso, Ir."');
      expect(csv).toContain("Hari Pertama");
      expect(csv).toContain("Undangan Terdaftar");
      expect(csv).toContain("Tamu Baru (Walk-in)");
      expect(csv).toContain("10:30:00 WIB");
      expect(csv).toContain("14:15:00 WIB");
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
