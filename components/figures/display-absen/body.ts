import * as k from "@/components/iso/iso-kit";
import type { Flat, Point3, Projection, SolidPaths } from "@/components/iso/iso-kit";

/**
 * Primitif bentuk organik untuk sosok manusia: permukaan "loft" dari cincin elips 3D.
 * Keluarannya SolidPaths biasa (fill, shades, top, outline) sehingga dipakai lewat solidSvg seperti prisma iso-kit.
 * Tiap facet dinilai dari normal 3D: menghadap kamera → dimasukkan ke salah satu dari 4 nada (atau "top" bila
 * menghadap atas). Siluet = convex hull, jadi tiap bagian dirancang cembung (pecah bila perlu).
 */

type V3 = Point3;

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

interface Ring {
  c: V3;
  pts: V3[];
}

function surface(rings: Ring[], P: Projection, caps: { first?: boolean; last?: boolean; topCos?: number } = {}): SolidPaths {
  const cam = k.cameraOf(P);
  const view: V3 = [cam.cosA * cam.cosE, cam.sinA * cam.cosE, cam.sinE];
  const light = norm([-cam.sinA, cam.cosA, 0.35]);
  const screen = rings.map((ring) => ring.pts.map((p) => k.iso(p, P)));
  const buckets: Flat[][][] = Array.from({ length: k.SHADES }, () => []);
  const tops: Flat[][] = [];

  const place = (n: V3, poly: Flat[]) => {
    if (dot(n, view) <= 1e-6) return;
    const u = norm(n);
    if (u[2] > (caps.topCos ?? 0.62)) {
      tops.push(poly);
      return;
    }
    const lit = (dot(u, light) + 1) / 2;
    buckets[Math.min(k.SHADES - 1, Math.max(0, Math.floor(lit * k.SHADES)))]!.push(poly);
  };

  for (let r = 0; r < rings.length - 1; r++) {
    const a = rings[r]!;
    const b = rings[r + 1]!;
    const count = a.pts.length;
    const mid = lerp3(a.c, b.c, 0.5);
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const q = [a.pts[i]!, a.pts[j]!, b.pts[j]!, b.pts[i]!];
      let n: V3 = [0, 0, 0];
      for (let m = 0; m < 4; m++) n = add(n, cross(q[m]!, q[(m + 1) % 4]!));
      if (Math.hypot(n[0], n[1], n[2]) < 1e-9) continue;
      const center = mul(add(add(q[0]!, q[1]!), add(q[2]!, q[3]!)), 0.25);
      if (dot(n, sub(center, mid)) < 0) n = mul(n, -1);
      place(n, [screen[r]![i]!, screen[r]![j]!, screen[r + 1]![j]!, screen[r + 1]![i]!]);
    }
  }
  if (caps.last && rings.length > 1) {
    const n = sub(rings[rings.length - 1]!.c, rings[rings.length - 2]!.c);
    place(n, screen[rings.length - 1]!);
  }
  if (caps.first && rings.length > 1) {
    const n = sub(rings[0]!.c, rings[1]!.c);
    place(n, screen[0]!);
  }

  const hull = k.convexHull(screen.flat());
  const join = (polys: Flat[][]) => polys.map((poly) => k.pathOf(poly, true)).join("");
  return {
    fill: k.pathOf(hull, true),
    outline: k.pathOf(hull, true),
    crease: "",
    top: join(tops),
    shades: buckets.map(join),
  };
}

export interface Section {
  z: number;
  rx: number;
  ry: number;
  dx?: number;
  dy?: number;
}

/** Tumpukan cincin elips mendatar (badan, kepala, rambut, kerudung, rok). Pusat (cx, cy), z mutlak per penampang. */
export function stack(cx: number, cy: number, sections: Section[], P: Projection, { n = 12, cap = true, topCos }: { n?: number; cap?: boolean; topCos?: number } = {}): SolidPaths {
  const rings: Ring[] = sections.map((s) => {
    const c: V3 = [cx + (s.dx ?? 0), cy + (s.dy ?? 0), s.z];
    const pts: V3[] = Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2;
      return [c[0] + s.rx * Math.cos(t), c[1] + s.ry * Math.sin(t), s.z] as V3;
    });
    return { c, pts };
  });
  return surface(rings, P, { last: cap, topCos });
}

/** Elipsoid (tangan, sepatu, telinga, sanggul). */
export function ellipsoid(c: V3, rx: number, ry: number, rz: number, P: Projection, { lat = 4, n = 8 }: { lat?: number; n?: number } = {}): SolidPaths {
  const sections: Section[] = Array.from({ length: lat + 1 }, (_, i) => {
    const phi = -Math.PI / 2 + (i / lat) * Math.PI;
    const s = Math.max(0.001, Math.cos(phi));
    return { z: c[2] + rz * Math.sin(phi), rx: rx * s, ry: ry * s };
  });
  return stack(c[0], c[1], sections, P, { n, cap: false, topCos: 0.88 });
}

/** Tabung meruncing berporos bebas (paha, betis, lengan, leher). `bulge` menggembungkan bagian tengah. */
export function limb(a: V3, b: V3, r0: number, r1: number, P: Projection, { n = 8, bulge = 0, capFirst = true }: { n?: number; bulge?: number; capFirst?: boolean } = {}): SolidPaths {
  const axis = norm(sub(b, a));
  const ref: V3 = Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u = norm(cross(axis, ref));
  const v = cross(axis, u);
  const ringAt = (c: V3, r: number): Ring => ({
    c,
    pts: Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2;
      return add(c, add(mul(u, r * Math.cos(t)), mul(v, r * Math.sin(t))));
    }),
  });
  const rings = [ringAt(a, r0)];
  if (bulge) rings.push(ringAt(lerp3(a, b, 0.4), ((r0 + r1) / 2) * (1 + bulge)));
  rings.push(ringAt(b, r1));
  return surface(rings, P, { first: capFirst, last: true });
}
