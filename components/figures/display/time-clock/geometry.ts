import * as k from "@/components/iso/iso-kit";
import type { Plan } from "@/components/iso/iso-kit";
import { toolsFor } from "../../shared";

/**
 * Fig 2 · Jam Absen Kartu — mesin time clock di atas pelat dasar (pengganti banner sambutan).
 * Kartu tamu baru turun ke slot di atas mesin, tuas di sisi kanan menekan (stempel waktu),
 * lalu kartu naik membawa cap "MASUK hh:mm". Di kiri tumpukan kartu Belum, di kanan tumpukan Hadir.
 */

export const WIDTH = 420;
export const HEIGHT = 300;
const AZIMUTH = 58;

const BASE: Plan = { x: -124, y: -52, w: 248, d: 100, r: 8 };
const BODY: Plan = { x: -40, y: -26, w: 80, d: 44, r: 6 };
export const BODY_H = 120;
const FRONT = BODY.y + BODY.d;
const SIDE = BODY.x + BODY.w;

export const CLOCK = { cx: 0, cz: 84, r: 25 };
const CLOCK_WIN = { x0: -25, x1: 25, z0: 59, z1: 109, r: 25, depth: 2.6 };
export const PRINT = { x0: -30, x1: 30, z0: 18, z1: 46, r: 3, depth: 1.4 };

// Kartu tegak di slot atas mesin
export const CARD = { x0: -28, x1: 28, y0: -5.6, y1: -4.2, z0: BODY_H - 18, z1: BODY_H + 52 };
export const CARD_FACE = CARD.y1;
const SLOT: Plan = { x: -32, y: -7.4, w: 64, d: 5, r: 1.2 };

// Tuas stempel di sisi kanan
const LEVER: Plan = { x: SIDE, y: -14, w: 7, d: 12, r: 1.6 };
export const LEVER_Z = 92;
export const LEVER_TRAVEL = 16;

const TRAY_L: Plan = { x: -116, y: -28, w: 52, d: 50, r: 3 };
const TRAY_R: Plan = { x: 64, y: -28, w: 52, d: 50, r: 3 };
const TRAY_H = 3;

export const P = k.fitProjection(
  [...k.boxCorners(BASE, -14, 0), ...k.boxCorners(BODY, 0, BODY_H), [CARD.x0, CARD.y1, CARD.z1 + 6], [CARD.x1, CARD.y1, CARD.z1 + 6]],
  WIDTH,
  HEIGHT,
  { pad: 8, azimuth: AZIMUTH }
);

const T = toolsFor(P, "tc");
const { at, S, L, D, planeOf, recess } = T;

const clockRecess = recess(CLOCK_WIN, FRONT, "da-glass");
const printRecess = recess(PRINT, FRONT, "da-glass");
const recessArt = (r: ReturnType<typeof recess>) => `${r.defs}<g clip-path="url(#${r.id})">${r.walls}<g transform="${r.backPlane}">${r.back}${r.backRim}</g></g>${r.rim}`;

function tray(plan: Plan) {
  return [
    S(k.slabOf(plan, 0, TRAY_H, P, 4, 0.5), { tone: "lo" }),
    S(k.slabOf({ x: plan.x, y: plan.y, w: plan.w, d: 4, r: 1 }, TRAY_H, 10, P, 2, 0.4), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(plan, 4), TRAY_H, P, 4), { tone: "faint" }),
  ].join("");
}

/** Tumpukan kartu datar di nampan (tinggi sebanding jumlah). */
export function stackArt(side: "left" | "right", height: number) {
  if (height <= 0) return "";
  const tray = side === "left" ? TRAY_L : TRAY_R;
  const plan: Plan = { x: tray.x + 7, y: tray.y + 9, w: tray.w - 14, d: tray.d - 15, r: 1 };
  const seams: string[] = [];
  for (let z = TRAY_H + 2; z < TRAY_H + height - 0.5; z += 2) seams.push(k.sideSeam(plan, z, P, 2));
  return [
    S(k.slabOf(plan, TRAY_H, height, P, 2), { tone: side === "right" ? "hi" : "mid", inner: L(seams.join(""), { tone: "faint" }) }),
    L(k.lineOnTop([plan.x + 5, plan.y + 7], [plan.x + plan.w - 8, plan.y + 7], TRAY_H + height, P), { tone: "lo", free: true }),
    L(k.lineOnTop([plan.x + 5, plan.y + 11], [plan.x + plan.w - 16, plan.y + 11], TRAY_H + height, P), { tone: "lo", free: true }),
  ].join("");
}

function machine() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(BODY, 0, 14, P)}"/>`);
  out.push(S(k.slabOf(k.insetPlan(BODY, 2), 0, 6, P, 6), { tone: "lo" }));
  out.push(
    S(k.slabOf(BODY, 6, BODY_H - 6, P, 8, 1.4), {
      tone: "mid",
      inner: L(k.sideSeam(BODY, 14, P, 8) + k.sideSeam(BODY, BODY_H - 8, P, 8), { tone: "faint" }),
    })
  );
  // Slot kartu di atas + sekrup tutup
  out.push(S(k.slabOf(SLOT, BODY_H, 1.2, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(SLOT, 1.2), BODY_H + 1.2, P, 3), { tone: "faint" }));
  out.push(D(k.corners(BODY, 6).map(([x, y]) => at([x, y, BODY_H])), { size: 0.5, tone: "mid" }));
  // Ventilasi sisi kanan
  const vents: string[] = [];
  for (let y = BODY.y + 8; y <= BODY.y + 36; y += 3.4) vents.push(T.sideSlot(SIDE, y, 20, 46));
  out.push(L(vents.join(""), { tone: "faint" }));
  // Jendela jam & jendela cetak
  out.push(recessArt(clockRecess), recessArt(printRecess));
  const ticks: string[] = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r1 = CLOCK.r - 1.6;
    const r0 = r1 - (i % 5 === 0 ? 4 : 1.8);
    ticks.push(`M${(CLOCK.cx + Math.sin(a) * r0).toFixed(2)} ${(-(CLOCK.cz + Math.cos(a) * r0)).toFixed(2)}L${(CLOCK.cx + Math.sin(a) * r1).toFixed(2)} ${(-(CLOCK.cz + Math.cos(a) * r1)).toFixed(2)}`);
  }
  out.push(`<g transform="${clockRecess.backPlane}"><path class="iso-line" data-tone="mid" d="${ticks.join("")}"/></g>`);
  // Pemandu tuas (alur vertikal di sisi kanan)
  out.push(L(T.sideSlot(SIDE, LEVER.y + LEVER.d / 2, LEVER_Z - LEVER_TRAVEL - 4, LEVER_Z + 12, 1.4), { tone: "lo" }));
  return out.join("");
}

/** Tuas stempel: digeser turun oleh live (translate z). */
export const LEVER_ART = [
  S(k.slabOf(LEVER, LEVER_Z, 8, P, 3, 0.5), { tone: "hi", crease: "lo" }),
  S(k.cylinder(SIDE + 10.5, LEVER.y + LEVER.d / 2, 4.6, LEVER_Z + 0.5, 7, P, 24, 0.5), { tone: "hi", crease: "lo" }),
].join("");
export const LEVER_DOWN = k.axisVector(P, [0, 0, -1]);

export const CARD_ART = {
  solid: S(k.slabOf({ x: CARD.x0, y: CARD.y0, w: CARD.x1 - CARD.x0, d: CARD.y1 - CARD.y0, r: 0.4 }, CARD.z0, CARD.z1 - CARD.z0, P, 2), { tone: "hi", crease: "lo", lit: true }),
  plane: planeOf(CARD_FACE + 0.02),
  /** Klip: hanya bagian kartu di atas mesin yang terlihat. */
  clip: k.pathOf(
    [
      at([CARD.x0 - 3, CARD.y1, BODY_H + 1.2]),
      at([CARD.x1 + 3, CARD.y1, BODY_H + 1.2]),
      at([CARD.x1 + 3, CARD.y0 - 1, BODY_H + 1.2]),
      at([CARD.x1 + 3, CARD.y0 - 1, BODY_H + 600]),
      at([CARD.x0 - 3, CARD.y1, BODY_H + 600]),
    ],
    true
  ),
  up: k.axisVector(P, [0, 0, 1]),
};

export const PLANES = { clock: clockRecess.backPlane, print: printRecess.backPlane };

export const ART_BASE = [T.basePlate(BASE, 8, 5), T.labelPlate({ x: BASE.x + 10, y: BASE.y + BASE.d - 14, w: 40, d: 9, r: 1.2 }), tray(TRAY_L)].join("");
export const ART_MACHINE = machine();
export const ART_TRAY_R = tray(TRAY_R);
