import * as k from "@/components/iso/iso-kit";
import type { Plan, Projection } from "@/components/iso/iso-kit";
import type { toolsFor } from "../shared";
import { ellipsoid, lerp3, limb, stack, type Section } from "./body";

type Tools = ReturnType<typeof toolsFor>;
type V3 = k.Point3;

/**
 * Sosok & kursi dibangun SEKALI di titik asal (0,0,0) lalu dipasang berulang lewat <use> + translate
 * (proyeksi affine: menggeser dunia = menggeser layar). Warna lewat variabel CSS pada <use>:
 * --sk kulit · --cl baju · --hr rambut/peci · --ac hijab/aksen. Celana, sepatu, kerah memakai warna tetap/turunan.
 *
 * Proporsi ±7,2 kepala (tinggi berdiri ≈ 39,5 satuan): kepala telur 5,5 tinggi, bahu ±11, pinggul ±8,6,
 * persendian pinggul/lutut/pergelangan serta bahu/siku/pergelangan; bagian dibangun dari loft elips (lihat body.ts).
 */

const box = (cx: number, cy: number, w: number, d: number, r = 1): Plan => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });

const SKIN = "pc p-skin";
const CLOTH = "pc p-cloth";
const HAIR = "pc p-hair";
const ACC = "pc p-acc";
const PANTS = "pc p-pants";
const SHOE = "pc p-shoe";
const WHITE = "pc p-white";

export type HeadKind = 0 | 1 | 2;

function solids(T: Tools) {
  const { S } = T;
  return {
    skin: (p: k.SolidPaths) => S(p, { tone: "mid", crease: "none", className: SKIN }),
    cloth: (p: k.SolidPaths) => S(p, { tone: "mid", crease: "none", className: CLOTH }),
    hair: (p: k.SolidPaths) => S(p, { tone: "lo", crease: "none", className: HAIR }),
    acc: (p: k.SolidPaths) => S(p, { tone: "mid", crease: "none", className: ACC }),
    pants: (p: k.SolidPaths) => S(p, { tone: "lo", crease: "none", className: PANTS }),
    shoe: (p: k.SolidPaths) => S(p, { tone: "lo", crease: "none", className: SHOE }),
    white: (p: k.SolidPaths) => S(p, { tone: "mid", crease: "none", className: WHITE }),
  };
}

/** Kursi tanpa penghuni: dasar (kaki + dudukan) dan sandaran dipisah agar sosok bisa diselipkan. */
export function chairArt(P: Projection, T: Tools) {
  const { S, L } = T;
  const legs: Plan = box(0, 0, 9, 7, 1.6);
  const pad: Plan = box(0, 0, 16, 12, 2.2);
  const back: Plan = { x: -7.6, y: 4.4, w: 15.2, d: 2.2, r: 1 };
  return {
    base: [
      S(k.slabOf(legs, 0, 6, P, 4), { tone: "lo" }),
      S(k.slabOf(pad, 6, 2.6, P, 5, 0.4), { tone: "mid", inner: L(k.sideSeam(pad, 7.2, P, 5), { tone: "faint" }) }),
    ].join(""),
    back: [
      S(k.slabOf(back, 8.6, 5.8, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(back, 13.2, P, 3), { tone: "faint" }) }),
      L(k.lineOnTop([-5.6, 5.5], [5.6, 5.5], 14.4, P), { tone: "lo" }),
    ].join(""),
  };
}

// ---------------------------------------------------------------- Urutan gambar
interface Part {
  svg: string;
  /** titik acuan untuk urutan painter (jauh → dekat) */
  at: V3;
  bias?: number;
}

const arrange = (P: Projection, parts: Part[]) =>
  [...parts]
    .sort((a, b) => k.depthOf(a.at, P) + (a.bias ?? 0) - (k.depthOf(b.at, P) + (b.bias ?? 0)))
    .map((p) => p.svg)
    .join("");

// ---------------------------------------------------------------- Kepala
/**
 * Kepala telur. face=true → wajah ke +y (penonton/layar), face=false → belakang kepala ke +y.
 * Rambut/peci/kerudung bergeser menjauhi arah wajah. zc = titik tengah kepala.
 */
function headParts(P: Projection, T: Tools, kind: HeadKind, zc: number, cy: number, face: boolean, cx = 0) {
  const s = solids(T);
  const f = face ? 1 : -1;
  const out: string[] = [];
  const skull: Section[] = [
    { z: zc - 2.75, rx: 0.9, ry: 1.1, dy: f * 0.35 },
    { z: zc - 2.2, rx: 1.6, ry: 1.8, dy: f * 0.5 },
    { z: zc - 1.2, rx: 2.2, ry: 2.4, dy: f * 0.25 },
    { z: zc, rx: 2.45, ry: 2.7 },
    { z: zc + 1.3, rx: 2.35, ry: 2.65, dy: -f * 0.05 },
    { z: zc + 2.2, rx: 1.8, ry: 2.1, dy: -f * 0.15 },
    { z: zc + 2.8, rx: 0.7, ry: 0.9, dy: -f * 0.2 },
  ];

  if (kind === 2) {
    // kerudung membungkus kepala; wajah oval terbuka di sisi depan
    out.push(
      s.acc(
        stack(cx, cy, [
          { z: zc - 3.0, rx: 2.3, ry: 2.5, dy: -f * 0.5 },
          { z: zc - 1.8, rx: 2.95, ry: 3.05, dy: -f * 0.45 },
          { z: zc, rx: 3.05, ry: 3.2, dy: -f * 0.4 },
          { z: zc + 1.5, rx: 2.85, ry: 3.0, dy: -f * 0.4 },
          { z: zc + 2.6, rx: 2.0, ry: 2.3, dy: -f * 0.35 },
          { z: zc + 3.2, rx: 0.8, ry: 1.0, dy: -f * 0.3 },
        ], P, { n: 14 })
      )
    );
    if (face) {
      out.push(
        s.skin(
          stack(cx, cy + 1.3, [
            { z: zc - 2.1, rx: 1.1, ry: 1.0 },
            { z: zc - 0.9, rx: 1.75, ry: 1.2 },
            { z: zc + 0.3, rx: 1.95, ry: 1.3 },
            { z: zc + 1.4, rx: 1.7, ry: 1.2 },
            { z: zc + 2.1, rx: 1.1, ry: 0.8 },
          ], P, { n: 10 })
        )
      );
    }
  } else {
    out.push(s.skin(stack(cx, cy, skull, P, { n: 12 })));
    if (kind === 0) {
      // rambut: tudung atas (garis rambut tinggi di dahi) + massa belakang sampai tengkuk
      out.push(
        s.hair(
          stack(cx, cy, [
            { z: zc - 1.5, rx: 2.0, ry: 1.5, dy: -f * 1.35 },
            { z: zc - 0.2, rx: 2.58, ry: 2.0, dy: -f * 0.95 },
            { z: zc + 1.4, rx: 2.55, ry: 2.2, dy: -f * 0.8 },
            { z: zc + 2.4, rx: 1.95, ry: 1.8, dy: -f * 0.5 },
          ], P, { n: 12, cap: false })
        )
      );
      out.push(
        s.hair(
          stack(cx, cy, [
            { z: zc + 1.35, rx: 2.55, ry: 2.8, dy: -f * 0.3 },
            { z: zc + 2.1, rx: 2.0, ry: 2.3, dy: -f * 0.25 },
            { z: zc + 2.7, rx: 1.1, ry: 1.4, dy: -f * 0.2 },
            { z: zc + 3.0, rx: 0.45, ry: 0.6, dy: -f * 0.2 },
          ], P, { n: 12 })
        )
      );
    } else {
      // peci hitam di atas rambut pendek
      out.push(
        s.hair(
          stack(cx, cy, [
            { z: zc - 1.3, rx: 1.9, ry: 1.3, dy: -f * 1.4 },
            { z: zc, rx: 2.5, ry: 1.9, dy: -f * 1.0 },
            { z: zc + 1.2, rx: 2.5, ry: 2.1, dy: -f * 0.8 },
          ], P, { n: 12, cap: false })
        )
      );
      out.push(
        s.hair(
          stack(cx, cy, [
            { z: zc + 1.0, rx: 2.72, ry: 2.95, dy: -f * 0.2 },
            { z: zc + 3.2, rx: 2.35, ry: 2.6, dy: -f * 0.2 },
            { z: zc + 3.45, rx: 2.15, ry: 2.4, dy: -f * 0.2 },
          ], P, { n: 12 })
        )
      );
    }
    // telinga terdekat (+x)
    out.push(s.skin(ellipsoid([cx + 2.4, cy - f * 0.1, zc - 0.1], 0.45, 0.7, 0.95, P, { lat: 3, n: 6 })));
  }

  if (face) {
    const u = k.cameraOf(P).k;
    const front = (x: number, dz: number, rx = 2.45, ry = 2.7, rz = 2.75) =>
      cy + (kind === 2 ? 1.3 + 1.3 * Math.sqrt(Math.max(0, 1 - (x / 1.95) ** 2 - (dz / 2.4) ** 2)) : ry * Math.sqrt(Math.max(0.05, 1 - (x / rx) ** 2 - (dz / rz) ** 2)));
    const e: string[] = [];
    for (const sx of [-0.95, 0.95]) {
      const [ex, ey] = k.iso([cx + sx, front(sx, 0.2), zc + 0.2], P);
      e.push(`<ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${(0.3 * u).toFixed(2)}" ry="${(0.38 * u).toFixed(2)}" class="ab-eye"/>`);
      const [bx, by] = k.iso([cx + sx, front(sx, 0.9), zc + 0.95], P);
      e.push(`<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${(0.6 * u).toFixed(2)}" ry="${(0.13 * u).toFixed(2)}" class="ab-brow"/>`);
    }
    const [nx, ny] = k.iso([cx, front(0, -0.6), zc - 0.6], P);
    e.push(`<ellipse cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" rx="${(0.3 * u).toFixed(2)}" ry="${(0.5 * u).toFixed(2)}" class="ab-nose"/>`);
    const [mx, my] = k.iso([cx, front(0, -1.5), zc - 1.5], P);
    e.push(`<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="${(0.75 * u).toFixed(2)}" ry="${(0.2 * u).toFixed(2)}" class="ab-mouth"/>`);
    out.push(e.join(""));
  }
  return out.join("");
}

// ---------------------------------------------------------------- Bagian badan bersama
interface Rig {
  /** puncak bahu (z) */
  zs: number;
  /** titik tengah badan (x, y) */
  cy: number;
}

/** Leher + kerah/kerudung. */
function neckParts(P: Projection, T: Tools, kind: HeadKind, rig: Rig): Part[] {
  const s = solids(T);
  const { zs, cy } = rig;
  const parts: Part[] = [];
  parts.push({ svg: s.skin(limb([0, cy, zs - 0.3], [0, cy, zs + 1.5], 1.05, 0.95, P, { n: 8 })), at: [0, cy, zs + 0.6], bias: 0.5 });
  if (kind === 0) {
    parts.push({
      svg: s.white(
        stack(0, cy, [
          { z: zs - 0.5, rx: 2.5, ry: 1.9 },
          { z: zs + 0.4, rx: 2.0, ry: 1.7 },
          { z: zs + 1.1, rx: 1.55, ry: 1.4 },
        ], P, { n: 10, cap: false })
      ),
      at: [0, cy, zs + 0.5],
      bias: 0.6,
    });
  } else if (kind === 2) {
    parts.push({
      svg: s.acc(
        stack(0, cy, [
          { z: zs + 1.8, rx: 2.5, ry: 2.5 },
          { z: zs + 0.5, rx: 3.8, ry: 2.8 },
          { z: zs - 1.0, rx: 4.85, ry: 3.1 },
          { z: zs - 3.2, rx: 4.65, ry: 3.0 },
          { z: zs - 4.8, rx: 4.1, ry: 2.8 },
        ], P, { n: 14 })
      ),
      at: [0, cy, zs - 1],
      bias: 0.4,
    });
  }
  return parts;
}

/** Satu lengan: bahu → siku → pergelangan + tangan. Lengan panjang untuk kind 1 & 2, pendek untuk kind 0. */
function armParts(P: Projection, T: Tools, kind: HeadKind, S0: V3, E: V3, W: V3, hand: { c: V3; r: V3 }): Part[] {
  const s = solids(T);
  const sleeve = kind !== 0;
  const upper = s.cloth(limb(S0, E, 1.3, 1.1, P, { n: 8, bulge: 0.06, capFirst: false }));
  const shoulder = s.cloth(ellipsoid(S0, 1.45, 1.5, 1.35, P, { lat: 3, n: 8 }));
  const lower = (sleeve ? s.cloth : s.skin)(limb(E, W, sleeve ? 1.05 : 0.95, 0.78, P, { n: 8 }));
  const palm = s.skin(ellipsoid(hand.c, hand.r[0], hand.r[1], hand.r[2], P, { lat: 3, n: 8 }));
  return [
    { svg: upper, at: lerp3(S0, E, 0.5) },
    { svg: shoulder, at: S0, bias: 0.01 },
    { svg: lower, at: lerp3(E, W, 0.5), bias: 0.02 },
    { svg: palm, at: hand.c, bias: 0.04 },
  ];
}

// ---------------------------------------------------------------- Duduk
/** Sosok duduk menghadap −y (panggung). Mengembalikan isi <g> siap pakai: badan + dua varian kepala. */
export function seatedArt(P: Projection, T: Tools, kind: HeadKind) {
  const s = solids(T);
  const parts: Part[] = [];
  const cy = 0.9; // titik tengah badan (y)
  const zs = 23.3; // puncak bahu
  const gamis = kind === 2;

  // kaki: paha ke depan, lutut menekuk ±90°, betis turun ke sepatu
  for (const sx of [-1, 1]) {
    const hip: V3 = [sx * 2.2, 0.9, 10.4];
    const knee: V3 = [sx * 2.5, -10.0, 10.6];
    const ankle: V3 = [sx * 2.6, -11.5, 2.6];
    const legTone = gamis ? s.cloth : s.pants;
    parts.push({ svg: legTone(limb(hip, knee, gamis ? 2.05 : 1.85, gamis ? 1.8 : 1.5, P, { n: 8, bulge: 0.05 })), at: lerp3(hip, knee, 0.5) });
    parts.push({ svg: legTone(limb(knee, ankle, gamis ? 1.7 : 1.4, gamis ? 1.35 : 1.0, P, { n: 8 })), at: lerp3(knee, ankle, 0.5), bias: 0.02 });
    parts.push({ svg: s.shoe(ellipsoid([sx * 2.6, -12.6, 1.2], 1.55, 2.5, 1.2, P, { lat: 3, n: 8 })), at: [sx * 2.6, -12.6, 1.2], bias: 0.03 });
  }
  // panggul + torso
  parts.push({
    svg: (gamis ? s.cloth : s.pants)(
      stack(0, cy, [
        { z: 8.95, rx: 3.5, ry: 2.7 },
        { z: 10.6, rx: 4.25, ry: 3.0 },
        { z: 14.0, rx: 3.7, ry: 2.4 },
        { z: 16.6, rx: 3.3, ry: 2.2 },
      ], P, { n: 12, cap: false })
    ),
    at: [0, cy, 12],
  });
  parts.push({
    svg: s.cloth(
      stack(0, cy - 0.2, [
        { z: 15.5, rx: 3.4, ry: 2.2 },
        { z: 17.5, rx: 3.5, ry: 2.2 },
        { z: 20.2, rx: 4.3, ry: 2.45 },
        { z: 22.4, rx: 4.55, ry: 2.4 },
        { z: zs, rx: 2.6, ry: 1.9 },
      ], P, { n: 12 })
    ),
    at: [0, cy, 19.5],
    bias: 0.05,
  });
  parts.push(...neckParts(P, T, kind, { zs, cy }));
  // lengan: siku menekuk, tangan di pangkuan
  for (const sx of [-1, 1]) {
    const S0: V3 = [sx * 4.35, cy, zs - 1.45];
    const E: V3 = [sx * 4.95, cy - 0.5, 15.2];
    const W: V3 = [sx * 3.5, -5.6, 12.9];
    parts.push(...armParts(P, T, kind, S0, E, W, { c: [sx * 3.3, -7.3, 12.9], r: [0.85, 1.25, 0.6] }));
  }
  const body = arrange(P, parts);
  const hc = zs + 3.65;
  return { body, back: headParts(P, T, kind, hc, cy - 0.2, false), face: headParts(P, T, kind, hc, cy - 0.2, true) };
}

// ---------------------------------------------------------------- Meja
/** Setengah badan menghadap +y (penonton) di balik meja: panelis, resepsionis. `deskZ` = tinggi permukaan meja. */
export function deskArt(P: Projection, T: Tools, kind: HeadKind, deskZ = 8) {
  const s = solids(T);
  const parts: Part[] = [];
  const cy = 0;
  const zs = deskZ + 11.6;
  const base = deskZ - 3;
  parts.push({
    svg: s.cloth(
      stack(0, cy, [
        { z: base, rx: 3.6, ry: 2.3 },
        { z: zs - 9.4, rx: 3.75, ry: 2.3 },
        { z: zs - 5.4, rx: 4.2, ry: 2.45 },
        { z: zs - 1.8, rx: 4.55, ry: 2.4 },
        { z: zs, rx: 2.6, ry: 1.9 },
      ], P, { n: 12 })
    ),
    at: [0, cy, base + 6],
  });
  parts.push(...neckParts(P, T, kind, { zs, cy }));
  for (const sx of [-1, 1]) {
    const S0: V3 = [sx * 4.35, cy, zs - 1.45];
    const E: V3 = [sx * 5.0, 1.2, deskZ + 0.4];
    const W: V3 = [sx * 3.6, 6.0, deskZ + 1.3];
    parts.push(...armParts(P, T, kind, S0, E, W, { c: [sx * 3.4, 7.5, deskZ + 1.3], r: [0.85, 1.25, 0.55] }));
  }
  return arrange(P, parts) + headParts(P, T, kind, zs + 3.65, cy, true);
}

// ---------------------------------------------------------------- Berdiri
/** Sosok berdiri (pejalan, usher, pembicara). step −1/0/1 = fase langkah; gesture = lengan kanan terangkat. */
export function standingArt(P: Projection, T: Tools, kind: HeadKind, step: -1 | 0 | 1, gesture?: "down" | "up") {
  const s = solids(T);
  const parts: Part[] = [];
  const cy = 0.1;
  const zs = 33.0;
  const gamis = kind === 2;
  const a = step * 2.8;

  // kaki (x=−2.3 maju bila step=1; x=+2.3 maju bila step=−1)
  for (const sx of [-1, 1]) {
    const dy = sx < 0 ? -a : a;
    const lift = (sx < 0 && step === 1) || (sx > 0 && step === -1) ? 0.9 : 0;
    const hip: V3 = [sx * 2.3, 0, 19.6];
    const knee: V3 = [sx * 2.45, dy * 0.6 + (dy < 0 ? -0.9 : 0), 10.9 + lift * 0.55];
    const ankle: V3 = [sx * 2.4, dy, 2.2 + lift];
    if (!gamis) {
      parts.push({ svg: s.pants(limb(hip, knee, 1.9, 1.5, P, { n: 8, bulge: 0.05 })), at: lerp3(hip, knee, 0.5) });
      parts.push({ svg: s.pants(limb(knee, ankle, 1.45, 1.0, P, { n: 8 })), at: lerp3(knee, ankle, 0.5), bias: 0.02 });
    } else {
      parts.push({ svg: s.skin(limb([sx * 2.4, dy * 0.8, 4.6 + lift], ankle, 0.85, 0.8, P, { n: 6 })), at: ankle });
    }
    parts.push({ svg: s.shoe(ellipsoid([sx * 2.4, dy - 0.9, 1.3 + lift], 1.55, 2.5, 1.2, P, { lat: 3, n: 8 })), at: [sx * 2.4, dy - 0.9, 1.3 + lift], bias: 0.03 });
  }
  // panggul / rok / torso
  if (gamis) {
    parts.push({
      svg: s.cloth(
        stack(0, cy, [
          { z: 3.4, rx: 4.5, ry: 3.4 },
          { z: 10.5, rx: 4.0, ry: 2.9 },
          { z: 17.5, rx: 3.8, ry: 2.5 },
          { z: 23.8, rx: 3.4, ry: 2.15 },
        ], P, { n: 14, cap: false })
      ),
      at: [0, cy, 13],
      bias: 0.04,
    });
  } else {
    parts.push({
      svg: s.pants(
        stack(0, cy, [
          { z: 18.7, rx: 3.6, ry: 2.4 },
          { z: 20.4, rx: 4.3, ry: 2.65 },
          { z: 23.7, rx: 3.5, ry: 2.15 },
        ], P, { n: 12, cap: false })
      ),
      at: [0, cy, 21],
    });
  }
  parts.push({
    svg: s.cloth(
      stack(0, cy, [
        { z: 23.2, rx: 3.35, ry: 2.15 },
        { z: 26.0, rx: 3.85, ry: 2.3 },
        { z: 29.2, rx: 4.5, ry: 2.5 },
        { z: 32.0, rx: 4.65, ry: 2.4 },
        { z: zs, rx: 2.6, ry: 1.9 },
      ], P, { n: 12 })
    ),
    at: [0, cy, 28],
    bias: 0.05,
  });
  parts.push(...neckParts(P, T, kind, { zs, cy }));
  // lengan berayun berlawanan dengan kaki di sisi yang sama
  const swing = step * 2;
  const armDown = (sx: number, y: number): Part[] => {
    const S0: V3 = [sx * 4.5, cy, zs - 1.5];
    const E: V3 = [sx * 4.9, y * 0.7 - 0.2, 24.6];
    const W: V3 = [sx * 4.9, y * 1.4 - 1.2, 18.2];
    return armParts(P, T, kind, S0, E, W, { c: [sx * 4.95, y * 1.55 - 1.4, 16.9], r: [0.75, 0.62, 1.15] });
  };
  parts.push(...armDown(-1, swing));
  let tail = "";
  if (gesture) {
    const down = arrange(P, armDown(1, -swing));
    const S0: V3 = [4.5, cy, zs - 1.5];
    const E: V3 = [7.6, -1.0, 27.0];
    const W: V3 = [8.4, -2.8, 32.4];
    const up = arrange(P, armParts(P, T, kind, S0, E, W, { c: [8.5, -3.1, 34.0], r: [0.7, 0.62, 1.15] }));
    tail = `<g class="ab-armdn">${down}</g><g class="ab-armup">${up}</g>`;
  } else parts.push(...armDown(1, -swing));
  const body = arrange(P, parts) + tail;
  const hc = zs + 3.9;
  return { body, back: headParts(P, T, kind, hc, cy, false), face: headParts(P, T, kind, hc, cy, true) };
}
