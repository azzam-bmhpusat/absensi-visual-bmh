import { describe, expect, it } from "vitest";
import * as k from "@/components/iso/iso-kit";
import { toolsFor } from "@/components/figures/shared";
import { deskArt, seatedArt, standingArt, type HeadKind } from "@/components/figures/display-absen/person";
import { ellipsoid, limb, stack } from "@/components/figures/display-absen/body";
import { AZIMUTH, ELEVATION } from "@/lib/display-absen-model";

const P: k.Projection = { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION };
const T = toolsFor(P, "t");
const KINDS: HeadKind[] = [0, 1];

/** Tinggi layar (y) semua titik path, dalam satuan dunia (dibagi cos(elevasi)·k). */
function heightUnits(svg: string) {
  const ys = [...svg.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[2]));
  const { cosE, k: kk } = k.cameraOf(P);
  return (Math.max(...ys) - Math.min(...ys)) / (cosE * kk);
}
const widthUnits = (svg: string) => {
  const xs = [...svg.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  return (Math.max(...xs) - Math.min(...xs)) / k.cameraOf(P).k;
};
const pathCount = (svg: string) => (svg.match(/<path/g) ?? []).length;

describe("body primitives", () => {
  it("menghasilkan SolidPaths terbatas (tanpa NaN) untuk tabung, elipsoid, dan tumpukan", () => {
    const parts = [
      limb([0, 0, 0], [3, -4, 8], 1.4, 1.0, P, { bulge: 0.1 }),
      ellipsoid([0, 0, 5], 2, 3, 2, P),
      stack(0, 0, [{ z: 0, rx: 3, ry: 2 }, { z: 5, rx: 2, ry: 1.5 }], P),
    ];
    for (const p of parts) {
      for (const d of [p.fill, p.outline, p.top, ...p.shades]) expect(d).not.toMatch(/NaN|Infinity/);
      expect(p.fill.length).toBeGreaterThan(10);
      expect(p.shades).toHaveLength(k.SHADES);
    }
  });
});

describe("sosok manusia /display-absen", () => {
  it.each(KINDS)("duduk (kind %i): proporsi masuk akal, muat di kursi, anggaran elemen terjaga", (kind) => {
    const { body, back, face } = seatedArt(P, T, kind);
    for (const svg of [body, back, face]) expect(svg).not.toMatch(/NaN|Infinity/);
    const whole = body + back;
    // tinggi duduk ≈ 29–31 satuan (dari lantai ke puncak kepala; selisih dengan sepatu di depan ikut terhitung)
    expect(heightUnits(whole)).toBeGreaterThan(24);
    expect(heightUnits(whole)).toBeLessThan(40);
    // lebar layar sosok tidak melebihi lebar dudukan (16) secara berlebihan
    expect(widthUnits(whole)).toBeLessThan(24);
    expect(pathCount(whole)).toBeLessThanOrEqual(330);
    expect(pathCount(face)).toBeGreaterThan(pathCount(back) - 4);
  });

  it.each(KINDS)("berdiri (kind %i): tiga frame langkah berbeda tetapi tinggi konsisten", (kind) => {
    const frames = ([-1, 0, 1] as const).map((step) => standingArt(P, T, kind, step).body + standingArt(P, T, kind, step).back);
    expect(new Set(frames).size).toBe(3);
    for (const svg of frames) {
      expect(svg).not.toMatch(/NaN|Infinity/);
      expect(heightUnits(svg)).toBeGreaterThan(36);
      expect(heightUnits(svg)).toBeLessThan(49);
      expect(pathCount(svg)).toBeLessThanOrEqual(340);
    }
  });

  it("pembicara punya dua posisi lengan (turun & terangkat) yang bergantian lewat kelas CSS", () => {
    const { body } = standingArt(P, T, 0, 0, "down");
    expect(body).toContain('class="ab-armdn"');
    expect(body).toContain('class="ab-armup"');
  });

  it.each(KINDS)("meja (kind %i): ada kepala berwajah dan lengan menumpu di meja", (kind) => {
    const svg = deskArt(P, T, kind, 8);
    expect(svg).not.toMatch(/NaN|Infinity/);
    expect(svg).toContain('class="ab-eye"');
    expect(deskArt(P, T, kind, 13)).not.toBe(svg);
  });
});
