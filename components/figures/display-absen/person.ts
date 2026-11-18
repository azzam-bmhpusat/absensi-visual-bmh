import * as k from "@/components/iso/iso-kit";
import type { Plan, Projection } from "@/components/iso/iso-kit";
import type { toolsFor } from "../shared";

type Tools = ReturnType<typeof toolsFor>;

/**
 * Sosok & kursi dibangun SEKALI di titik asal (0,0,0) lalu dipasang berulang lewat <use> + translate
 * (proyeksi affine: menggeser dunia = menggeser layar). Warna lewat variabel CSS pada <use>:
 * --sk kulit · --cl baju · --hr rambut/peci · --ac hijab/aksen.
 */

const box = (cx: number, cy: number, w: number, d: number, r = 1): Plan => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });

const SKIN = "pc p-skin";
const CLOTH = "pc p-cloth";
const HAIR = "pc p-hair";
const ACC = "pc p-acc";

export type HeadKind = 0 | 1 | 2;

function solids(T: Tools) {
  const { S } = T;
  return {
    skin: (p: k.SolidPaths) => S(p, { tone: "mid", crease: "none", className: SKIN }),
    cloth: (p: k.SolidPaths) => S(p, { tone: "mid", crease: "faint", className: CLOTH }),
    hair: (p: k.SolidPaths) => S(p, { tone: "lo", crease: "none", className: HAIR }),
    acc: (p: k.SolidPaths) => S(p, { tone: "mid", crease: "faint", className: ACC }),
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

function headParts(P: Projection, T: Tools, kind: HeadKind, baseZ: number, cy: number, face: boolean) {
  const s = solids(T);
  const out: string[] = [];
  const z0 = baseZ;
  out.push(s.skin(k.cylinder(0, cy, 3.5, z0, 6.8, P, 20, 1)));
  const hairY = face ? cy - 1.3 : cy + 0.7;
  if (kind === 0) {
    out.push(s.hair(k.cylinder(0, hairY, 3.65, z0 + 2.6, 4.7, P, 20, 1)));
  } else if (kind === 1) {
    out.push(s.hair(k.cylinder(0, hairY, 3.55, z0 + 2.7, 2.6, P, 20, 0.5)));
    out.push(s.hair(k.cylinder(0, cy, 3.75, z0 + 5.2, 3.5, P, 20, 1.1)));
  } else {
    out.push(s.acc(k.cylinder(0, face ? cy - 0.9 : cy + 0.5, 4.2, z0 - 0.5, 8.3, P, 22, 1.3)));
    if (face) out.push(s.skin(k.cylinder(0, cy + 1.6, 2.6, z0 + 0.8, 4.4, P, 16, 0.5)));
  }
  if (face) {
    const u = k.cameraOf(P).k;
    const eyeY = cy + (kind === 2 ? 4.3 : 3.8);
    const eyes = [-1.35, 1.35].map((x) => {
      const [ex, ey] = k.iso([x, eyeY, z0 + 3.4], P);
      return `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(0.5 * u).toFixed(2)}" class="ab-eye"/>`;
    });
    const [mx, my] = k.iso([0, eyeY, z0 + 1.2], P);
    eyes.push(`<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="${(0.9 * u).toFixed(2)}" ry="${(0.22 * u).toFixed(2)}" class="ab-eye"/>`);
    out.push(eyes.join(""));
  }
  return out.join("");
}

/** Sosok duduk menghadap −y (panggung). Mengembalikan isi <g> siap pakai: badan + dua varian kepala. */
export function seatedArt(P: Projection, T: Tools, kind: HeadKind) {
  const s = solids(T);
  const parts: string[] = [];
  // sepatu, betis, paha (paling jauh dari penonton dulu)
  for (const sx of [-2.9, 2.9]) {
    parts.push(s.cloth(k.slabOf(box(sx, -11.2, 3.6, 5, 1.2), 0, 1.8, P, 4)));
    parts.push(s.cloth(k.cylinder(sx, -9.3, 1.55, 1.8, 7, P, 10)));
    parts.push(s.cloth(k.slabOf(box(sx, -3.8, 3.5, 11.6, 1.3), 8.6, 3.2, P, 4, 0.3)));
  }
  // lengan bawah + tangan di pangkuan
  for (const sx of [-6.7, 6.7]) {
    parts.push(s.cloth(k.slabOf(box(sx, -5.2, 2.8, 8.2, 1.2), 11.3, 2.8, P, 4, 0.3)));
    parts.push(s.skin(k.slabOf(box(sx, -10.1, 2.5, 2.6, 1), 11.4, 2.3, P, 4)));
  }
  parts.push(s.cloth(k.slabOf(box(0, 0.6, 9.6, 7, 2.4), 8.6, 3.4, P, 6, 0.3)));
  parts.push(s.cloth(k.slabOf(box(0, 1.2, 9.8, 5.4, 2.2), 11.4, 7.8, P, 6, 0.4)));
  parts.push(s.cloth(k.slabOf(box(0, 1.1, 13, 5.4, 2.4), 16.2, 3.4, P, 6, 0.5)));
  // lengan atas
  for (const sx of [-6.9, 6.9]) parts.push(s.cloth(k.cylinder(sx, 1.1, 1.6, 11.8, 7.6, P, 10, 0.4)));
  if (kind === 2) parts.push(s.acc(k.slabOf(box(0, 0.9, 14.6, 7.2, 3.2), 15.6, 4.4, P, 8, 0.7)));
  parts.push(s.skin(k.cylinder(0, 1.2, 1.3, 19.4, 2.4, P, 10)));
  const back = headParts(P, T, kind, 21, 1.2, false);
  const face = headParts(P, T, kind, 21, 1.2, true);
  return { body: parts.join(""), back, face };
}

/** Setengah badan menghadap +y (penonton) di balik meja: panelis, resepsionis. Kepala menghadap penonton. */
export function deskArt(P: Projection, T: Tools, kind: HeadKind) {
  const s = solids(T);
  const parts: string[] = [];
  parts.push(s.cloth(k.slabOf(box(0, 0, 9.8, 5.4, 2.2), 6, 11, P, 6, 0.4)));
  parts.push(s.cloth(k.slabOf(box(0, 0, 13, 5.4, 2.4), 14.2, 3.6, P, 6, 0.5)));
  if (kind === 2) parts.push(s.acc(k.slabOf(box(0, 0, 14.6, 7.2, 3.2), 13.6, 4.6, P, 8, 0.7)));
  parts.push(s.skin(k.cylinder(0, 0, 1.3, 17.6, 2.4, P, 10)));
  parts.push(headParts(P, T, kind, 19.2, 0, true));
  for (const sx of [-6.8, 6.8]) {
    parts.push(s.cloth(k.cylinder(sx, 0, 1.6, 9.6, 7.8, P, 10, 0.4)));
    parts.push(s.cloth(k.slabOf(box(sx, 4.4, 2.8, 8, 1.2), 9.4, 2.8, P, 4, 0.3)));
    parts.push(s.skin(k.slabOf(box(sx * 0.82, 9.4, 2.6, 2.6, 1), 9.5, 2.2, P, 4)));
  }
  return parts.join("");
}

/** Sosok berdiri (pejalan, usher, pembicara). step −1/0/1 = fase langkah; gesture = lengan kanan terangkat. */
export function standingArt(P: Projection, T: Tools, kind: HeadKind, step: -1 | 0 | 1, gesture?: "down" | "up") {
  const s = solids(T);
  const parts: string[] = [];
  const leg = (sx: number, dy: number, lift: number) => {
    parts.push(s.cloth(k.slabOf(box(sx, dy - 0.6, 3.6, 5, 1.2), lift, 1.8, P, 4)));
    parts.push(s.cloth(k.cylinder(sx, dy, 1.75, lift + 1.8, 14.4 - lift, P, 10, 0.2)));
  };
  // kaki yang jauh dulu
  const a = step * 2.8;
  leg(-2.4, -a, step === 1 ? 0.9 : 0);
  leg(2.4, a, step === -1 ? 0.9 : 0);
  parts.push(s.cloth(k.slabOf(box(0, 0, 9.4, 6, 2.4), 15.2, 4.6, P, 6, 0.3)));
  parts.push(s.cloth(k.slabOf(box(0, 0, 9.8, 5.4, 2.2), 19, 10, P, 6, 0.4)));
  parts.push(s.cloth(k.slabOf(box(0, 0, 13, 5.4, 2.4), 27.4, 3.6, P, 6, 0.5)));
  const swing = step * 2;
  const arm = (sx: number, dy: number) => {
    parts.push(s.cloth(k.cylinder(sx, dy, 1.5, 17.4, 12.2, P, 10, 0.3)));
    parts.push(s.skin(k.cylinder(sx, dy, 1.25, 15.6, 2.2, P, 8)));
  };
  arm(-6.7, swing);
  if (gesture) {
    const down = (() => {
      const q: string[] = [];
      q.push(s.cloth(k.cylinder(6.7, -swing, 1.5, 17.4, 12.2, P, 10, 0.3)));
      q.push(s.skin(k.cylinder(6.7, -swing, 1.25, 15.6, 2.2, P, 8)));
      return q.join("");
    })();
    const up = [
      s.cloth(k.slabOf(box(9.6, -1, 7, 2.8, 1.2), 25.6, 2.8, P, 4, 0.3)),
      s.cloth(k.cylinder(12.4, -1, 1.45, 27, 6.6, P, 10, 0.3)),
      s.skin(k.cylinder(12.4, -1, 1.3, 33.2, 2.4, P, 8)),
    ].join("");
    parts.push(`<g class="ab-armdn">${down}</g><g class="ab-armup">${up}</g>`);
  } else arm(6.7, -swing);
  if (kind === 2) parts.push(s.acc(k.slabOf(box(0, 0, 14.6, 7.2, 3.2), 26.8, 4.6, P, 8, 0.7)));
  parts.push(s.skin(k.cylinder(0, 0.2, 1.3, 30.8, 2.4, P, 10)));
  const back = headParts(P, T, kind, 32.4, 0.2, false);
  const face = headParts(P, T, kind, 32.4, 0.2, true);
  return { body: parts.join(""), back, face };
}
