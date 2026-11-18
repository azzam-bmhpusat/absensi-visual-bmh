import { describe, expect, it } from "vitest";
import {
  CARD_ENTER,
  CARD_INSERT,
  PUNCH_MS,
  punchPose,
  stackHeight,
  clockHands,
  fitText,
  hallReadout,
  knobAngle,
  nextPage,
  pagesOf,
  seatColumnsFor,
  seatLayout,
  sessionIndexAt,
  sessionShortName,
  wibClockText,
} from "@/lib/display-anatomy-model";

const guest = (id: string, nama: string, daerah: string) => ({ id, nama, perwakilan_daerah: daerah });

describe("display anatomy model", () => {
  it("menata satu kursi per tamu, urut daerah lalu nama", () => {
    const layout = seatLayout([
      guest("1", "Zainal", "Jawa Timur"),
      guest("2", "Ahmad", "Aceh"),
      guest("3", "Budi", "Jawa Timur"),
    ]);
    expect(layout.seats.map((s) => s.guestId)).toEqual(["2", "3", "1"]);
    expect(layout.cols).toBe(6);
    expect(layout.rows).toBe(1);
    const big = seatLayout(Array.from({ length: 47 }, (_, i) => guest(String(i), `T${i}`, "X")));
    expect(big.seats).toHaveLength(47);
    expect(big.cols).toBe(8);
    expect(big.rows).toBe(6);
    expect(big.seats[46]).toMatchObject({ row: 5, col: 6 });
    expect(seatColumnsFor(200)).toBe(16);
  });

  it("membagi halaman dan berputar melingkar", () => {
    expect(pagesOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(pagesOf([], 4)).toEqual([[]]);
    expect(nextPage(2, 3)).toBe(0);
    expect(nextPage(0, 1)).toBe(0);
  });

  it("sudut kenop dan sesi saling bolak-balik", () => {
    expect(knobAngle(0, 9)).toBe(-135);
    expect(knobAngle(8, 9)).toBe(135);
    expect(knobAngle(4, 9)).toBe(0);
    for (let i = 0; i < 9; i++) expect(sessionIndexAt(knobAngle(i, 9), 9)).toBe(i);
    expect(sessionIndexAt(999, 9)).toBe(8);
  });

  it("jarum jam memakai waktu WIB", () => {
    // 02:30:15 UTC = 09:30:15 WIB
    const d = new Date("2026-11-18T02:30:15Z");
    expect(wibClockText(d)).toBe("09:30:15");
    expect(clockHands(d)).toEqual({ hour: 285, minute: 181.5, second: 90 });
  });

  it("teks: potong nama, nama sesi singkat, readout aula", () => {
    expect(fitText("Muhammad Abdurrahman Al-Fatih", 12)).toBe("Muhammad Ab…");
    expect(sessionShortName("Masuk Setelah Makan Malam")).toBe("Malam");
    expect(sessionShortName("Penutupan Acara Besar")).toBe("Penutupan…");
    expect(hallReadout(23, 47)).toBe("23/47 hadir · 49%");
    expect(hallReadout(0, 0)).toBe("0/0 hadir · 0%");
  });
});


describe("jam absen kartu", () => {
  it("urutan pose: turun, masuk slot, stempel, naik, keluar", () => {
    expect(punchPose(0)).toMatchObject({ card: CARD_ENTER, opacity: 0 });
    expect(punchPose(1000).card).toBeCloseTo(0);
    expect(punchPose(1800).card).toBeCloseTo(CARD_INSERT);
    expect(punchPose(2000).lever).toBe(1);
    expect(punchPose(1800).stamped).toBe(false);
    expect(punchPose(3500)).toMatchObject({ card: 0, lever: 0, stamped: true, opacity: 1 });
    expect(punchPose(PUNCH_MS).opacity).toBe(0);
  });

  it("tumpukan kartu sebanding dengan jumlah", () => {
    expect(stackHeight(0, 47)).toBe(0);
    expect(stackHeight(47, 47)).toBe(26);
    expect(stackHeight(1, 47)).toBe(1.2);
    expect(stackHeight(10, 0)).toBe(0);
  });
});
