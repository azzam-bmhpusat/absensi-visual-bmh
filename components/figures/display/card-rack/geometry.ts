import * as k from "@/components/iso/iso-kit";
import type { Plan } from "@/components/iso/iso-kit";
import { toolsFor } from "../../shared";

/**
 * Fig 3/4 · Rak Kartu — rak kartu absen berdiri di atas plint, 2 kolom × 8 baris saku.
 * Tiap kartu berdiri di sakunya; muka depan kartu (bidang y = CARD_FACE) memuat nama & daerah.
 * Kamera azimuth 72° agar muka depan hampir menghadap penonton (nama terbaca dari jauh).
 */

export const WIDTH = 400;
export const HEIGHT = 560;
export const AZIMUTH = 72;

export const ROWS = 8;
export const COLS = 2;
export const PER_PAGE = ROWS * COLS;

const PANEL_X0 = -150;
const PANEL_X1 = 150;
const PANEL: Plan = { x: PANEL_X0, y: -14, w: PANEL_X1 - PANEL_X0, d: 9, r: 1.5 };
const PLINTH: Plan = { x: -170, y: -34, w: 340, d: 46, r: 4 };
const PLINTH_H = 10;
const FOOT_H = 4;

export const ROW_H = 48;
const ROW_Z0 = 14;
export const LIP_H = 18;
export const CARD_H = 44;
export const CARD_W = 136;
const CARD_GAP = 8;
export const CARD_FACE = -2.2;
const CARD_BACK = -3.6;
const LIP: { y: number; d: number } = { y: -1.4, d: 3.6 };
export const SINK = CARD_H + 2 - LIP_H; // seberapa jauh kartu turun agar tersembunyi di balik bibir saku

const HEADER_Z0 = ROW_Z0 + ROWS * ROW_H + 4;
const HEADER_H = 46;
export const TOP = HEADER_Z0 + HEADER_H;
const HEADER: Plan = { x: PANEL_X0, y: -16, w: PANEL_X1 - PANEL_X0, d: 18, r: 2 };
export const HEADER_FACE = HEADER.y + HEADER.d;
export const LCD = { x0: PANEL_X0 + 10, x1: PANEL_X1 - 44, z0: HEADER_Z0 + 8, z1: HEADER_Z0 + HEADER_H - 8, r: 3, depth: 1.2 };
export const DIAL: [number, number] = [PANEL_X1 - 22, HEADER.y + HEADER.d / 2];
export const DIAL_R = 8;
export const DIAL_TOP = TOP + 5;

export const rowZ = (row: number) => ROW_Z0 + (ROWS - 1 - row) * ROW_H; // baris 0 = paling atas
export const colX = (col: number) => (col === 0 ? -CARD_GAP / 2 - CARD_W : CARD_GAP / 2);

export const P = k.fitProjection(
  [...k.boxCorners(PLINTH, -PLINTH_H - FOOT_H, 0), ...k.boxCorners(HEADER, 0, TOP + 6), ...k.boxCorners({ x: PANEL_X0 - 10, y: -16, w: 320, d: 22, r: 0 }, 0, TOP)],
  WIDTH,
  HEIGHT,
  { pad: 14, azimuth: AZIMUTH }
);

const T = toolsFor(P, "rk");
const { at, S, L, D, planeOf, flat, recess } = T;
export const FACE_PLANE = planeOf(CARD_FACE);

function plinth() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLINTH, -PLINTH_H - FOOT_H, PLINTH_H, P)}"/>`];
  for (const [x, y] of T.byDepth(k.corners(PLINTH, 14))) {
    out.push(S(k.cylinder(x, y, 6, -PLINTH_H - FOOT_H, 1.4, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.6, -PLINTH_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLINTH, -PLINTH_H, PLINTH_H, P, 6, 1.2), { tone: "mid", inner: L(k.sideSeam(PLINTH, -PLINTH_H / 2, P, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLINTH, 4), 0, P, 6), { tone: "lo" }));
  out.push(D(k.corners(PLINTH, 7).map(([x, y]) => at([x, y, 0])), { size: 0.5, tone: "mid" }));
  // Penggaris di depan plint
  const ruler: Plan = { x: -120, y: PLINTH.y + PLINTH.d - 10, w: 240, d: 6, r: 1 };
  out.push(T.ruler(ruler));
  return out.join("");
}

/** Panel belakang + dua tiang samping + kotak kepala dengan LCD. */
function frame() {
  const out: string[] = [];
  out.push(S(k.slabOf(PANEL, 0, HEADER_Z0, P, 3, 0.6), { tone: "mid" }));
  // Alur horizontal di panel (rel saku) + sekrup panel
  const rails: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    const z = rowZ(r) + LIP_H + 1.5;
    rails.push(k.pathOf([at([PANEL_X0 + 2, PANEL.y + PANEL.d, z]), at([PANEL_X1 - 2, PANEL.y + PANEL.d, z])]));
  }
  out.push(L(rails.join(""), { tone: "faint" }));
  // Tiang samping (kiri di belakang kartu, kanan digambar di depan — lihat FRONT)
  out.push(S(k.slabOf({ x: PANEL_X0 - 8, y: -16, w: 8, d: 22, r: 1.5 }, 0, HEADER_Z0, P, 3, 0.6), { tone: "mid" }));
  return out.join("");
}

function header() {
  const out: string[] = [];
  out.push(S(k.slabOf({ ...HEADER, x: HEADER.x - 8, w: HEADER.w + 16 }, HEADER_Z0, HEADER_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam({ ...HEADER, x: HEADER.x - 8, w: HEADER.w + 16 }, HEADER_Z0 + 4, P, 4), { tone: "faint" }) }));
  out.push(D([at([HEADER.x - 4, HEADER_FACE, HEADER_Z0 + HEADER_H - 5]), at([HEADER.x - 4, HEADER_FACE, HEADER_Z0 + 5]), at([HEADER.x + HEADER.w + 4, HEADER_FACE, HEADER_Z0 + HEADER_H - 5]), at([HEADER.x + HEADER.w + 4, HEADER_FACE, HEADER_Z0 + 5])], { size: 0.5, tone: "mid" }));
  // Kenop halaman di atas kotak kepala
  out.push(S(k.cylinder(DIAL[0], DIAL[1], DIAL_R + 2, TOP, 1.2, P, 32), { tone: "lo" }));
  // Skala 12 posisi di cincin dasar (bagian depan tertutup badan kenop yang digambar sesudahnya)
  const ticks = k.radialTicks(DIAL[0], DIAL[1], DIAL_R + 1.8, 12, 3, TOP + 1.2, [0.6, 1.2], P);
  out.push(L(ticks.minor, { tone: "lo" }) + L(ticks.major, { tone: "mid" }));
  out.push(S(k.cylinder(DIAL[0], DIAL[1], DIAL_R, TOP + 1.2, DIAL_TOP - TOP - 1.2, P, 40, 0.5), { tone: "mid" }));
  out.push(L(k.knurl(DIAL[0], DIAL[1], DIAL_R, TOP + 1.2, DIAL_TOP, 30, P), { tone: "lo" }));
  return out.join("");
}

export const LCD_RECESS = recess(LCD, HEADER_FACE, "da-glass");

/** Tiang kanan + bibir saku (digambar di depan kartu). Bibir per baris dibuat terpisah agar urutan benar. */
export function lipOf(row: number, col: number) {
  const x = colX(col);
  const z = rowZ(row);
  const plan: Plan = { x: x - 3, y: LIP.y, w: CARD_W + 6, d: LIP.d, r: 1 };
  return [
    S(k.slabOf(plan, z, LIP_H, P, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, z + LIP_H - 4, P, 2), { tone: "faint" }) }),
    D([at([x + 4, LIP.y + LIP.d, z + LIP_H / 2]), at([x + CARD_W - 4, LIP.y + LIP.d, z + LIP_H / 2])], { size: 0.45, tone: "mid" }),
  ].join("");
}

export const RIGHT_POST = S(k.slabOf({ x: PANEL_X1, y: -16, w: 8, d: 22, r: 1.5 }, 0, HEADER_Z0, P, 3, 0.6), { tone: "mid" });

/** Kartu di slot (row, col): badan statis (biasa & menyala), bidang muka untuk teks. */
export function cardSolid(row: number, col: number, lit: boolean) {
  const plan: Plan = { x: colX(col), y: CARD_BACK, w: CARD_W, d: CARD_FACE - CARD_BACK, r: 0.6 };
  return S(k.slabOf(plan, rowZ(row) + 2, CARD_H, P, 2), { tone: lit ? "hi" : "mid", crease: "lo", lit });
}

/** Klip per baris: hanya bagian kartu di atas dasar saku yang boleh terlihat. */
export function rowClip(row: number) {
  const z0 = rowZ(row);
  return `<path transform="${planeOf(CARD_FACE)}" d="${flat(PANEL_X0, z0, PANEL_X1, z0 + CARD_H + 6, 0)}"/>`;
}

export const SINK_VECTOR = k.axisVector(P, [0, 0, -1]);
export const DIAL_CENTER = at([DIAL[0], DIAL[1], DIAL_TOP]);

/** Jarum kenop halaman (dibangun ulang per halaman, sudut 0 = −y, searah jarum jam dari atas). */
export function dialPointer(angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const tip = at([DIAL[0] + Math.sin(a) * (DIAL_R - 1.5), DIAL[1] - Math.cos(a) * (DIAL_R - 1.5), DIAL_TOP]);
  return k.pathOf([DIAL_CENTER, tip]);
}

export const ART_BACK = [plinth(), frame(), header(), LCD_RECESS.defs, `<g clip-path="url(#${LCD_RECESS.id})">${LCD_RECESS.walls}<g transform="${LCD_RECESS.backPlane}">${LCD_RECESS.back}</g></g>`].join("");
export const LCD_PLANE = LCD_RECESS.backPlane;
export const LCD_RIM = LCD_RECESS.rim;
