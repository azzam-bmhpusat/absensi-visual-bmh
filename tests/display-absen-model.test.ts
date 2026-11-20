import { describe, expect, it } from "vitest";
import {
  LANE,
  PITCH_Y,
  WING_MIN,
  announceMs,
  bucketAspect,
  buildSeats,
  capacityFor,
  firstWords,
  lookOf,
  newArrivals,
  nextTour,
  planHall,
  pointOnRoute,
  projectedAspect,
  routeLength,
  seatPos,
  slotOfY,
  walkRoute,
} from "@/lib/display-absen-model";
import type { AttendanceData, GuestData } from "@/lib/display-helpers";

const guest = (id: string, nama: string, daerah: string): GuestData => ({ id, nama, perwakilan_daerah: daerah });
const att = (id: string, guestId: string | null, nama: string, at: string): AttendanceData => ({
  id,
  session_id: 1,
  guest_id: guestId,
  nama,
  perwakilan_daerah: "Pusat",
  is_walk_in: !guestId,
  checked_in_at: at,
});

describe("display absen model", () => {
  it("satu kursi per tamu (urut daerah, nama) + walk-in di akhir urut waktu", () => {
    const seats = buildSeats(
      [guest("1", "Zainal", "Jawa Timur"), guest("2", "Ahmad", "Aceh"), guest("3", "Budi", "Jawa Timur")],
      [att("a2", null, "Walk B", "2026-11-18T03:00:00Z"), att("a1", "2", "Ahmad", "2026-11-18T02:00:00Z"), att("a3", null, "Walk A", "2026-11-18T01:00:00Z")]
    );
    expect(seats.map((s) => s.key)).toEqual(["2", "3", "1", "w:a3", "w:a2"]);
    expect(seats[0].attendanceId).toBe("a1");
    expect(seats[1].attendanceId).toBeNull();
    expect(seats[3].walkIn).toBe(true);
  });

  it("kapasitas berkelipatan 8 dan menyisakan cadangan walk-in", () => {
    expect(capacityFor(0)).toBe(16);
    expect(capacityFor(100) % 8).toBe(0);
    expect(capacityFor(100)).toBeGreaterThanOrEqual(106);
    expect(capacityFor(112)).toBe(capacityFor(113));
    for (const n of [0, 5, 40, 120, 333]) expect(capacityFor(n)).toBeGreaterThanOrEqual(n + 6);
  });

  it("mendeteksi absensi baru", () => {
    expect(newArrivals(new Set(["a", "b"]), ["a", "b", "c", "d"])).toEqual(["c", "d"]);
    expect(newArrivals(new Set(), [])).toEqual([]);
  });

  it("aspek dibulatkan dan dibatasi", () => {
    expect(bucketAspect(16 / 9)).toBe(1.8);
    expect(bucketAspect(0.5)).toBe(1.25);
    expect(bucketAspect(9)).toBe(2.6);
    expect(bucketAspect(NaN)).toBeCloseTo(1.8, 5);
  });

  it.each([1.33, 1.78, 2.4])("planHall menampung semua kursi dan memenuhi rasio layar %s", (aspect) => {
    for (const cap of [16, 64, 120, 240, 320]) {
      const plan = planHall(cap, aspect);
      expect(plan.cols * plan.rows).toBeGreaterThanOrEqual(cap);
      expect(plan.floorW).toBeGreaterThanOrEqual(plan.stageW);
      expect(projectedAspect(plan.floorW, plan.rows)).toBeGreaterThanOrEqual(bucketAspect(aspect) - 0.02);
      // tanpa pembatasan sayap minimum, lantai pas selebar layar
      if (plan.wing > WING_MIN + 0.5) expect(projectedAspect(plan.floorW, plan.rows)).toBeCloseTo(bucketAspect(aspect), 1);
    }
  });

  it("posisi kursi: kolom simetris dan baris naik ke belakang", () => {
    const plan = planHall(120, 16 / 9);
    const first = seatPos(plan, 0);
    const last = seatPos(plan, plan.cols - 1);
    expect(first.x).toBeCloseTo(-last.x, 5);
    const nextRow = seatPos(plan, plan.cols);
    expect(nextRow.row).toBe(1);
    expect(nextRow.y).toBeGreaterThan(first.y);
    expect(nextRow.z).toBeGreaterThan(first.z);
  });

  it("rute jalan berakhir di kursi dan z mengikuti tribun", () => {
    const plan = planHall(120, 16 / 9);
    const index = plan.cols * 3 + plan.cols - 2;
    const seat = seatPos(plan, index);
    const route = walkRoute(plan, index);
    const end = pointOnRoute(route, routeLength(route) + 10);
    expect(end.done).toBe(true);
    expect(end.x).toBeCloseTo(seat.x, 5);
    expect(end.z).toBeCloseTo(seat.z, 5);
    const start = pointOnRoute(route, 0);
    expect(start.x).toBeCloseTo(route[0][0], 5);
    const mid = pointOnRoute(route, routeLength(route) / 2);
    expect(mid.done).toBe(false);
  });

  it("slot gambar: jalur kaki baris r berada di slot r, di belakang baris terakhir = teras", () => {
    expect(slotOfY(PITCH_Y * 2 + LANE / 2, 10)).toBe(2);
    expect(slotOfY(-5, 10)).toBe(0);
    expect(slotOfY(9999, 10)).toBe(10);
  });

  it("varian sosok deterministik", () => {
    expect(lookOf("abc")).toEqual(lookOf("abc"));
    expect(lookOf("abc")).not.toEqual(lookOf("abd"));
    expect([0, 1]).toContain(lookOf("x").head);
  });

  it("teks nama ringkas & tur sorot melingkar", () => {
    expect(firstWords("Muhammad Abdurrahman Wahid", 16)).toBe("Muhammad");
    expect(firstWords("Dr Ali Umar", 12)).toBe("Dr Ali Umar");
    expect(firstWords("Abdurrahmanussalam", 8).length).toBeLessThanOrEqual(8);
    expect(nextTour([2, 5, 9], -1)).toBe(2);
    expect(nextTour([2, 5, 9], 5)).toBe(9);
    expect(nextTour([2, 5, 9], 9)).toBe(2);
    expect(nextTour([], 0)).toBeNull();
  });

  it("pengumuman LED lebih singkat bila antrean panjang", () => {
    expect(announceMs(1)).toBeGreaterThan(announceMs(3));
    expect(announceMs(3)).toBeGreaterThan(announceMs(9));
  });
});
