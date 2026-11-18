import * as k from "@/components/iso/iso-kit";
import type { Plan, Plane, Projection } from "@/components/iso/iso-kit";

/** Helper bersama untuk figur Anatomy di /admin/qr/live (string SVG, dihitung sekali). */
export function toolsFor(P: Projection, prefix: string) {
  const at = (point: k.Point3) => k.iso(point, P);
  const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
  const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
  const D = (points: Array<k.Flat | [number, number, number]>, style?: { size?: number; tone?: k.Tone }) => k.dotsSvg(points, style);
  const byDepth = <T extends Plane>(points: T[]) =>
    [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  /** Transform yang memetakan koordinat lokal (x, −z) ke bidang vertikal y. */
  const planeOf = (y: number) => k.sideMatrix([0, y], 0, P, "left");
  /** Persegi membulat di bidang muka, dalam koordinat lokal (x, −z). */
  const flat = (x0: number, z0: number, x1: number, z1: number, r: number, steps = 6) =>
    k.pathOf(
      k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z] as k.Flat),
      true
    );
  /** Slot vertikal tertutup di sisi +x (ventilasi). */
  const sideSlot = (x: number, y: number, z0: number, z1: number, half = 0.8) =>
    k.pathOf(
      k.roundedPlan({ x: y - half, y: z0, w: half * 2, d: z1 - z0, r: half }, 4).map(([u, z]) => at([x, u, z])),
      true
    );

  let clips = 0;
  interface Window {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
    r: number;
    depth: number;
  }
  /**
   * Ceruk di muka vertikal y: dinding dalam diarsir menurut arah hadap, dasar di y − depth.
   * Mengembalikan potongan string agar konten dinamis (React) bisa diletakkan di dalam klip.
   */
  function recess(win: Window, y: number, backClass: string) {
    const { x0, x1, z0, z1, r, depth } = win;
    const id = `${prefix}-clip-${clips++}`;
    const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const { sinA } = k.cameraOf(P);
    const tops: string[] = [];
    const sides: string[][] = [[], [], [], []];
    ring.forEach(([ax, az], index) => {
      const [bx, bz] = ring[(index + 1) % ring.length];
      const length = Math.hypot(bx - ax, bz - az) || 1;
      let nx = (bz - az) / length;
      let nz = -(bx - ax) / length;
      if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
      if (nx <= 0 && nz <= 0) return;
      const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
      if (nz >= nx) tops.push(quad);
      else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
    });
    const shape = flat(x0, z0, x1, z1, r);
    return {
      id,
      defs: `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
      walls: [
        `<path class="iso-top" d="${tops.join("")}"/>`,
        ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
      ].join(""),
      backPlane: planeOf(y - depth),
      back: `<path class="${backClass}" d="${shape}"/>`,
      backRim: `<path class="iso-line" data-tone="faint" d="${shape}"/>`,
      rim: `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
      shape,
    };
  }

  /** Pelat dasar berkaki dengan alur, sekrup sudut, dan plat label (pola test rig). */
  function basePlate(base: Plan, baseH: number, footH: number) {
    const out = [`<path class="iso-halo" d="${k.haloOf(base, -baseH - footH, baseH, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(base, 20))) {
      out.push(S(k.cylinder(x, y, 7, -baseH - footH, 1.6, P, 28), { tone: "lo" }));
      out.push(S(k.cylinder(x, y, 5.4, -baseH - footH + 1.6, footH - 1.6, P, 28), { tone: "mid" }));
    }
    out.push(S(k.slabOf(base, -baseH, baseH, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(base, -baseH * 0.45, P, 8), { tone: "faint" }) }));
    out.push(L(k.planOutline(k.insetPlan(base, 4.5), 0, P), { tone: "lo" }));
    const screws = k.corners(base, 9);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5, tone: "mid" }));
    return out.join("");
  }

  /** Plat label kecil dengan tiga garis cetak dan satu sekrup. */
  function labelPlate(plan: Plan, z = 0) {
    const rows = [0.62, 0.42, 0.54].map((w, i) =>
      k.lineOnTop([plan.x + 3.5, plan.y + 2.4 + i * 2.1], [plan.x + 3.5 + (plan.w - 10) * w, plan.y + 2.4 + i * 2.1], z + 0.8, P)
    );
    return [
      S(k.slabOf(plan, z, 0.8, P, 3), { tone: "lo", crease: "none" }),
      L(rows.join(""), { tone: "lo", free: true }),
      D([at([plan.x + plan.w - 3, plan.y + plan.d / 2, z + 0.8])], { size: 0.45, tone: "mid" }),
    ].join("");
  }

  /** Penggaris berskala di atas pelat: garis minor tiap 4, mayor tiap 5 garis. */
  function ruler(plan: Plan, z = 0) {
    const ticks = k.topTicks(plan.x + 3, plan.x + plan.w - 3, 4, 5, plan.y, z + 0.8, [2.2, 4], P, "x");
    return [
      S(k.slabOf(plan, z, 0.8, P, 3), { tone: "lo", crease: "none" }),
      L(ticks.minor, { tone: "lo" }),
      L(ticks.major, { tone: "mid" }),
    ].join("");
  }

  return { at, S, L, D, byDepth, planeOf, flat, sideSlot, recess, basePlate, labelPlate, ruler };
}
