import { describe, it, expect } from "vitest";
import {
  resolveActiveSession,
  deriveAttendanceData,
  getTodayWibDate,
  formatWibClock,
  formatAttendanceDateTime,
  formatGuestAffiliation,
  type SessionData,
  type GuestData,
  type AttendanceData,
} from "../lib/display-helpers";

describe("display-helpers", () => {
  const dummySessions: SessionData[] = [
    { id: 1, slug: "hari-1", nama: "Hari Pertama", tanggal: "2026-11-14" },
    { id: 2, slug: "hari-2", nama: "Hari Kedua", tanggal: "2026-11-15" },
  ];

  describe("resolveActiveSession", () => {
    it("memilih sesi berdasarkan angka query param ?sesi=2", () => {
      const active = resolveActiveSession(dummySessions, "2", "2026-11-14");
      expect(active.id).toBe(2);
      expect(active.nama).toBe("Hari Kedua");
    });

    it("memilih sesi berdasarkan slug ?sesi=hari-2", () => {
      const active = resolveActiveSession(dummySessions, "hari-2", "2026-11-14");
      expect(active.id).toBe(2);
    });

    it("fallback ke tanggal hari ini jika query param tidak ada", () => {
      const active = resolveActiveSession(dummySessions, undefined, "2026-11-15");
      expect(active.id).toBe(2);
    });

    it("fallback ke Sesi 1 jika query param tidak ada dan tanggal tidak cocok", () => {
      const active = resolveActiveSession(dummySessions, undefined, "2026-01-01");
      expect(active.id).toBe(1);
    });

    it("fallback aman jika array sesi kosong", () => {
      const active = resolveActiveSession([], "3");
      expect(active.id).toBe(1);
    });
  });

  describe("deriveAttendanceData", () => {
    const guests: GuestData[] = [
      { id: "g-1", nama: "Ahmad", perwakilan_daerah: "Surabaya" },
      { id: "g-2", nama: "Budi", perwakilan_daerah: "Malang" },
      { id: "g-3", nama: "Cahyo", perwakilan_daerah: "Surabaya" },
      { id: "g-4", nama: "Dedi", perwakilan_daerah: "Bandung" },
    ];

    const attendances: AttendanceData[] = [
      {
        id: "att-1",
        session_id: 1,
        guest_id: "g-1",
        nama: "Ahmad",
        perwakilan_daerah: "Surabaya",
        is_walk_in: false,
        checked_in_at: "2026-11-14T08:00:00Z",
      },
      {
        id: "att-2",
        session_id: 1,
        guest_id: null,
        nama: "Eko Walk-in",
        perwakilan_daerah: "Jakarta",
        is_walk_in: true,
        checked_in_at: "2026-11-14T08:30:00Z",
      },
      {
        id: "att-3",
        session_id: 2, // Sesi lain
        guest_id: "g-2",
        nama: "Budi",
        perwakilan_daerah: "Malang",
        is_walk_in: false,
        checked_in_at: "2026-11-15T08:00:00Z",
      },
    ];

    it("menghitung hadir dan mengurutkan terbaru di atas", () => {
      const res = deriveAttendanceData(guests, attendances, 1);
      expect(res.hadir.length).toBe(2);
      expect(res.hadir[0].nama).toBe("Eko Walk-in"); // 08:30 lebih baru dari 08:00
      expect(res.hadir[1].nama).toBe("Ahmad");
    });

    it("menghitung belumHadir secara benar dan mengurutkannya berdasarkan daerah lalu nama", () => {
      const res = deriveAttendanceData(guests, attendances, 1);
      // g-1 sudah hadir, maka g-2 (Malang), g-3 (Surabaya), g-4 (Bandung) belum hadir
      expect(res.belumHadir.length).toBe(3);
      // Urut daerah: Bandung (g-4) -> Malang (g-2) -> Surabaya (g-3)
      expect(res.belumHadir[0].nama).toBe("Dedi"); // Bandung
      expect(res.belumHadir[1].nama).toBe("Budi"); // Malang
      expect(res.belumHadir[2].nama).toBe("Cahyo"); // Surabaya
    });

    it("memastikan total tamu bersumber dari guests dan walk-in dihitung di Hadir", () => {
      const res = deriveAttendanceData(guests, attendances, 1);
      expect(res.totalGuests).toBe(4);
      expect(res.hadirCount).toBe(2);
      expect(res.percentage).toBe(50); // 2/4 * 100 = 50%
    });

    it("mengelompokkan per daerah jika belumHadir > 40", () => {
      const manyGuests: GuestData[] = Array.from({ length: 45 }, (_, i) => ({
        id: `guest-${i}`,
        nama: `Tamu ${i}`,
        perwakilan_daerah: i % 2 === 0 ? "Daerah A" : "Daerah B",
      }));

      const res = deriveAttendanceData(manyGuests, [], 1);
      expect(res.belumHadir.length).toBe(45);
      expect(res.groupedBelumHadir).not.toBeNull();
      expect(Object.keys(res.groupedBelumHadir!)).toContain("Daerah A");
      expect(Object.keys(res.groupedBelumHadir!)).toContain("Daerah B");
    });
  });

  describe("formatWibClock & getTodayWibDate", () => {
    it("menghasilkan format jam WIB dengan suffix WIB", () => {
      const clock = formatWibClock(new Date("2026-11-14T03:30:00Z")); // UTC 03:30 = WIB 10:30
      expect(clock).toContain("10:30:00 WIB");
    });

    it("menghasilkan format tanggal YYYY-MM-DD", () => {
      const dateStr = getTodayWibDate(new Date("2026-11-14T03:30:00Z"));
      expect(dateStr).toBe("2026-11-14");
    });

    it("memformat waktu kehadiran lengkap: jam hingga hari dan tanggal WIB", () => {
      // UTC 06:45 = WIB 13:45 pada hari Jumat, 13 November 2026
      const formatted = formatAttendanceDateTime("2026-11-13T06:45:00Z");
      expect(formatted).toContain("13:45 WIB");
      expect(formatted).toContain("2026");
      expect(formatted).toContain("Jumat");
    });

    it("menangani input tanggal tidak valid atau kosong secara aman", () => {
      expect(formatAttendanceDateTime(null)).toBe("-");
      expect(formatAttendanceDateTime(undefined)).toBe("-");
      expect(formatAttendanceDateTime("invalid-date")).toBe("-");
    });
  });

  describe("formatGuestAffiliation", () => {
    it("memformat Ketua Departemen dengan Departemen IT", () => {
      const label = formatGuestAffiliation({
        nama: "Fulan",
        jabatan: "Ketua Departemen",
        departemen: "IT",
        perwakilan_daerah: "Pusat",
      } as any);
      expect(label).toBe("Ketua Departemen: IT");
    });

    it("memformat Ketua Daerah dengan BMH Jawa Timur", () => {
      const label = formatGuestAffiliation({
        nama: "Ahmad Fauzi",
        jabatan: "Ketua Daerah",
        perwakilan_daerah: "BMH Jawa Timur",
      } as any);
      expect(label).toBe("Ketua Daerah — BMH Jawa Timur");
    });

    it("memformat delegasi perwakilan daerah biasa", () => {
      const label = formatGuestAffiliation({
        nama: "Siti Khadijah",
        perwakilan_daerah: "BMH Jawa Barat",
      } as any);
      expect(label).toBe("BMH Jawa Barat");
    });

    it("fallback ke Tamu Undangan jika semua field kosong", () => {
      const label = formatGuestAffiliation({});
      expect(label).toBe("Tamu Undangan");
    });
  });
});
