import * as k from "@/components/iso/iso-kit";
import type { Plan } from "@/components/iso/iso-kit";
import { toolsFor } from "../../shared";

/**
 * Fig 0 · Panel Kontrol — konsol memanjang (pengganti header & footer /display):
 * plat nama acara, jam analog WIB, LCD sesi, plat "Scan QR", kenop pemilih sesi 9 posisi,
 * dan lampu status realtime. Kamera azimuth 82° agar muka depan hampir frontal.
 */

export const WIDTH = 1400;
export const HEIGHT = 196;
const AZIMUTH = 86;

const BODY: Plan = { x: -500, y: -36, w: 1000, d: 58, r: 6 };
const BODY_H = 66;
export const FRONT = BODY.y + BODY.d;
const PLINTH: Plan = { x: -488, y: -30, w: 976, d: 48, r: 4 };

export const NAME = { x0: -484, x1: -176, z0: 9, z1: 57, r: 3, depth: 1.4 };
export const CLOCK = { cx: -130, cz: 33, r: 24 };
const CLOCK_WIN = { x0: CLOCK.cx - CLOCK.r, x1: CLOCK.cx + CLOCK.r, z0: CLOCK.cz - CLOCK.r, z1: CLOCK.cz + CLOCK.r, r: CLOCK.r, depth: 2.4 };
export const LCD = { x0: -92, x1: 286, z0: 9, z1: 57, r: 3, depth: 1.4 };
export const QR_PLATE = { x0: 384, x1: 484, z0: 12, z1: 54, r: 2.4, depth: 0.8 };

export const KNOB: [number, number] = [334, -8];
export const KNOB_R = 15;
const KNOB_Z = BODY_H;
export const KNOB_TOP = BODY_H + 9;
export const STUD_R = 25;
export const LAMP: [number, number] = [-153, -14];

export const P = k.fitProjection([...k.boxCorners(BODY, -6, KNOB_TOP + 2)], WIDTH, HEIGHT, { pad: 10, azimuth: AZIMUTH });

const T = toolsFor(P, "cp");
const { at, S, L, D, recess } = T;

const nameRecess = recess(NAME, FRONT, "da-glass");
const clockRecess = recess(CLOCK_WIN, FRONT, "da-glass");
const lcdRecess = recess(LCD, FRONT, "da-glass");
const qrRecess = recess(QR_PLATE, FRONT, "da-glass");

const recessArt = (r: ReturnType<typeof recess>) =>
  `${r.defs}<g clip-path="url(#${r.id})">${r.walls}<g transform="${r.backPlane}">${r.back}${r.backRim}</g></g>`;

/** Titik paku di sudut sebuah jendela di muka depan. */
const cornerScrews = (w: { x0: number; x1: number; z0: number; z1: number }, inset = 4) =>
  D(
    [
      at([w.x0 - inset, FRONT, w.z0 - inset + 2]),
      at([w.x1 + inset, FRONT, w.z0 - inset + 2]),
      at([w.x0 - inset, FRONT, w.z1 + inset - 2]),
      at([w.x1 + inset, FRONT, w.z1 + inset - 2]),
    ],
    { size: 0.5, tone: "mid" }
  );

function body() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(BODY, -6, 10, P)}"/>`);
  out.push(S(k.slabOf(PLINTH, -6, 6, P, 4), { tone: "lo" }));
  out.push(
    S(k.slabOf(BODY, 0, BODY_H, P, 6, 1.4), {
      tone: "mid",
      inner: L(k.sideSeam(BODY, 4, P, 6) + k.sideSeam(BODY, BODY_H - 4, P, 6), { tone: "faint" }),
    })
  );
  // Ventilasi di atas (sisi kiri) — slot tertutup
  const vents: string[] = [];
  for (let x = -478; x <= -250; x += 8) vents.push(k.planOutline({ x, y: -26, w: 3, d: 20, r: 1.5 }, BODY_H, P, 3));
  out.push(L(vents.join(""), { tone: "faint" }));
  // Alur di atas sepanjang konsol
  out.push(L(k.planOutline(k.insetPlan(BODY, 5), BODY_H, P, 6), { tone: "faint" }));
  // Jendela-jendela muka depan
  out.push(recessArt(nameRecess), nameRecess.rim, cornerScrews(NAME));
  out.push(recessArt(clockRecess), clockRecess.rim);
  out.push(recessArt(lcdRecess), lcdRecess.rim, cornerScrews(LCD));
  out.push(recessArt(qrRecess), qrRecess.rim, cornerScrews(QR_PLATE));
  // Skala jam: 60 tanda, besar tiap 5
  const ticks: string[] = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r1 = CLOCK.r - 1.5;
    const r0 = r1 - (i % 5 === 0 ? 3.6 : 1.6);
    ticks.push(`M${(CLOCK.cx + Math.sin(a) * r0).toFixed(2)} ${(-(CLOCK.cz + Math.cos(a) * r0)).toFixed(2)}L${(CLOCK.cx + Math.sin(a) * r1).toFixed(2)} ${(-(CLOCK.cz + Math.cos(a) * r1)).toFixed(2)}`);
  }
  out.push(`<g transform="${clockRecess.backPlane}"><path class="iso-line" data-tone="mid" d="${ticks.join("")}"/></g>`);
  return out.join("");
}

function knob() {
  const out: string[] = [];
  out.push(S(k.cylinder(KNOB[0], KNOB[1], STUD_R + 5, KNOB_Z, 1.2, P, 56), { tone: "lo" }));
  out.push(L(k.ring(KNOB[0], KNOB[1], STUD_R + 3, KNOB_Z + 1.2, P, 56), { tone: "faint" }));
  out.push(S(k.cylinder(KNOB[0], KNOB[1], KNOB_R + 2, KNOB_Z + 1.2, 2, P, 48), { tone: "mid" }));
  out.push(S(k.cylinder(KNOB[0], KNOB[1], KNOB_R, KNOB_Z + 3.2, KNOB_TOP - KNOB_Z - 3.2, P, 56, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(KNOB[0], KNOB[1], KNOB_R, KNOB_Z + 3.2, KNOB_TOP, 44, P), { tone: "lo" }));
  out.push(L(k.ring(KNOB[0], KNOB[1], KNOB_R - 4, KNOB_TOP, P, 40), { tone: "faint" }));
  return out.join("");
}

/** Poros jarum kenop (digambar di atas jarum agar pangkal jarum berakhir di titik). */
export function knobHub() {
  return D([at([KNOB[0], KNOB[1], KNOB_TOP])], { size: 1.6, tone: "hi" });
}

function lampBase() {
  return [
    S(k.cylinder(LAMP[0], LAMP[1], 8, BODY_H, 1.4, P, 32), { tone: "lo" }),
    S(k.cylinder(LAMP[0], LAMP[1], 6, BODY_H + 1.4, 3, P, 32, 0.4), { tone: "mid" }),
  ].join("");
}

/** Kubah lampu (nyala/padam) di atas dudukannya. */
export const LAMP_DOME = {
  on: S(k.cylinder(LAMP[0], LAMP[1], 4.4, BODY_H + 4.4, 5, P, 32, 0.8), { tone: "hi", lit: true }),
  off: S(k.cylinder(LAMP[0], LAMP[1], 4.4, BODY_H + 4.4, 5, P, 32, 0.8), { tone: "mid" }),
  glow: at([LAMP[0], LAMP[1], BODY_H + 9.4]),
};

/** Paku posisi sesi di sekeliling kenop (indeks 0..n−1), sudut dalam derajat. */
export function studsFor(angles: number[]) {
  return angles.map((deg) => {
    const a = (deg * Math.PI) / 180;
    const x = KNOB[0] + Math.sin(a) * STUD_R;
    const y = KNOB[1] - Math.cos(a) * STUD_R;
    return {
      off: S(k.cylinder(x, y, 2.2, KNOB_Z + 1.2, 1.6, P, 16), { tone: "mid" }),
      on: S(k.cylinder(x, y, 2.2, KNOB_Z + 1.2, 1.6, P, 16), { tone: "hi", lit: true }),
      hit: at([x, y, KNOB_Z + 2]),
      depth: k.depthOf([x, y, 0], P),
    };
  });
}

/** Jarum kenop pada sudut tertentu (garis di atas kenop + takik di tepinya). */
export function knobPointer(deg: number) {
  const a = (deg * Math.PI) / 180;
  const p = (r: number) => at([KNOB[0] + Math.sin(a) * r, KNOB[1] - Math.cos(a) * r, KNOB_TOP]);
  return k.pathOf([p(0), p(KNOB_R - 1.6)]);
}

export const KNOB_CENTER = at([KNOB[0], KNOB[1], KNOB_TOP]);
export const KNOB_DEPTH = k.depthOf([KNOB[0], KNOB[1], 0], P);
export const ART_BACK = [body(), lampBase()].join("");
export const ART_KNOB = knob();
export const PLANES = {
  name: nameRecess.backPlane,
  clock: clockRecess.backPlane,
  lcd: lcdRecess.backPlane,
  qr: qrRecess.backPlane,
};
