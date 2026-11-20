import { describe, it, expect } from "vitest";
import { filterGuestsByMode } from "../lib/guest-pdf";

const guests = [
  { nama: "A", mode_kehadiran: "offline" },
  { nama: "B", mode_kehadiran: "online" },
  { nama: "C", mode_kehadiran: "offline" },
  { nama: "D", mode_kehadiran: null },
  { nama: "E" },
];

describe("filterGuestsByMode", () => {
  it("'all' mengembalikan semua tamu termasuk yang belum punya data kehadiran", () => {
    expect(filterGuestsByMode(guests, "all")).toHaveLength(5);
  });

  it("'offline' hanya tamu offline", () => {
    expect(filterGuestsByMode(guests, "offline").map((g) => g.nama)).toEqual(["A", "C"]);
  });

  it("'online' hanya tamu online", () => {
    expect(filterGuestsByMode(guests, "online").map((g) => g.nama)).toEqual(["B"]);
  });

  it("tamu tanpa data kehadiran tidak ikut filter offline maupun online", () => {
    const names = [
      ...filterGuestsByMode(guests, "offline"),
      ...filterGuestsByMode(guests, "online"),
    ].map((g) => g.nama);
    expect(names).not.toContain("D");
    expect(names).not.toContain("E");
  });
});
