import { describe, expect, it } from "vitest";
import { deriveAttendanceData, type GuestData } from "@/lib/display-helpers";
import { buildSeats } from "@/lib/display-absen-model";
import { seatLayout } from "@/lib/display-anatomy-model";

// Profil peserta bisa belum mengisi perwakilan_daerah (null dari database).
const guests = [
  { id: "1", nama: "Budi", perwakilan_daerah: "Jawa Timur" },
  { id: "2", nama: "Ani", perwakilan_daerah: null },
  { id: "3", nama: "Citra", perwakilan_daerah: "Aceh" },
] as unknown as GuestData[];

describe("tamu tanpa perwakilan_daerah", () => {
  it("deriveAttendanceData tidak crash dan mengurutkan yang kosong lebih dulu", () => {
    const { belumHadir } = deriveAttendanceData(guests, [], 1);
    expect(belumHadir.map((g) => g.nama)).toEqual(["Ani", "Citra", "Budi"]);
  });
  it("buildSeats dan seatLayout tidak crash", () => {
    expect(buildSeats(guests, []).map((s) => s.nama)).toEqual(["Ani", "Citra", "Budi"]);
    expect(seatLayout(guests).seats.map((s) => s.nama)).toEqual(["Ani", "Citra", "Budi"]);
  });
});
