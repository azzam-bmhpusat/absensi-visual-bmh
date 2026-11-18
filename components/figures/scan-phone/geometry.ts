import QRCode from "qrcode";
import * as k from "@/components/iso/iso-kit";
import type { Plan } from "@/components/iso/iso-kit";
import { toolsFor } from "../shared";

/**
 * Fig 1 · Pemindai — HP berdiri di dudukan, layar menghadap penonton.
 * Kartu QR berdiri di dudukan kecil di belakang-kanan; kamera belakang HP membidiknya.
 * Satuan dunia ≈ 1 px benda nyata: x, y di lantai, z ke atas.
 */

export const WIDTH = 360;
export const HEIGHT = 390;
export const AZIMUTH = 50;

const BASE: Plan = { x: -86, y: -82, w: 196, d: 150, r: 9 };
const BASE_H = 8;
const FOOT_H = 5;

// Dudukan HP (cradle)
const CRADLE: Plan = { x: -48, y: -10, w: 96, d: 30, r: 4 };
const CRADLE_H = 7;
const JAW_BACK: Plan = { x: -44, y: -8, w: 88, d: 8, r: 2 };
const JAW_FRONT: Plan = { x: -44, y: 10, w: 88, d: 8, r: 2 };
const JAW_BACK_H = 18;
const JAW_FRONT_H = 9;

// HP
export const PHONE: Plan = { x: -36, y: 0, w: 72, d: 9, r: 4 };
export const PHONE_Z0 = CRADLE_H;
export const PHONE_Z1 = 158;
export const FRONT = PHONE.y + PHONE.d;
const PHONE_SIDE = PHONE.x + PHONE.w;
export const BEZEL = { x0: -32.5, x1: 32.5, z0: 13, z1: 154, r: 5, depth: 0.6 };
export const GLASS = { x0: -30.5, x1: 30.5, z0: 16, z1: 151, r: 3.6, depth: 0.9 };
export const GLASS_Y = FRONT - BEZEL.depth - GLASS.depth;

// Kartu QR di dudukan
const EASEL_FOOT: Plan = { x: 48, y: -70, w: 58, d: 16, r: 3 };
const EASEL_POST: Plan = { x: 73, y: -70, w: 8, d: 5, r: 1.5 };
const CARD: Plan = { x: 50, y: -64, w: 54, d: 2.4, r: 1.2 };
export const CARD_FACE = CARD.y + CARD.d;
const CARD_Z0 = 22;
const CARD_Z1 = 80;
const LEDGE: Plan = { x: 49, y: CARD_FACE, w: 56, d: 4.5, r: 1.2 };
export const QR_BOX = { x0: 57, x1: 97, z0: 32, z1: 72 };

// Kamera belakang HP (tersembunyi di muka belakang); berkas sinar keluar dari sini
export const CAMERA: k.Point3 = [PHONE_SIDE - 9, PHONE.y, 140];

const pad = 18;
export const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), ...k.boxCorners(PHONE, PHONE_Z0, PHONE_Z1), ...k.boxCorners(CARD, CARD_Z0, CARD_Z1)],
  WIDTH,
  HEIGHT,
  { pad, azimuth: AZIMUTH }
);

const T = toolsFor(P, "sp");
const { at, S, L, D, planeOf, flat, sideSlot, recess, basePlate, labelPlate, ruler } = T;

// ---------- Kartu QR: matriks QR asli ----------
const QR = QRCode.create("BMH-RAKERNAS-2026", { errorCorrectionLevel: "M" });
/** Modul QR sebagai path di bidang muka, koordinat lokal (x, −z). */
export function qrModules(box: { x0: number; x1: number; z1: number } = QR_BOX) {
  const n = QR.modules.size;
  const cell = (box.x1 - box.x0) / n;
  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!QR.modules.get(r, c)) continue;
      const u = box.x0 + c * cell;
      const v = -(box.z1 - r * cell);
      parts.push(`M${u.toFixed(2)} ${v.toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h${(-cell).toFixed(2)}Z`);
    }
  }
  return parts.join("");
}

function easelAndCard() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(EASEL_FOOT, 0, 4, P)}"/>`);
  out.push(S(k.slabOf(EASEL_FOOT, 0, 4, P, 4, 0.8), { tone: "lo" }));
  out.push(D([at([EASEL_FOOT.x + 4, EASEL_FOOT.y + 4, 4]), at([EASEL_FOOT.x + EASEL_FOOT.w - 4, EASEL_FOOT.y + 4, 4])], { size: 0.45, tone: "mid" }));
  out.push(S(k.slabOf(EASEL_POST, 4, CARD_Z1 - 10, P, 3), { tone: "mid" }));
  // Kartu tipis + cetakan QR di muka depannya
  out.push(S(k.slabOf(CARD, CARD_Z0, CARD_Z1 - CARD_Z0, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  out.push(
    `<g transform="${planeOf(CARD_FACE)}">` +
      `<path class="sp-qr" d="${qrModules()}"/>` +
      `<path class="iso-line" data-tone="faint" d="${flat(CARD.x + 2.5, CARD_Z0 + 3, CARD.x + CARD.w - 2.5, CARD_Z1 - 3, 1.2)}"/>` +
      `</g>`
  );
  // Ledge di depan kartu menahan tepi bawah
  out.push(S(k.slabOf(LEDGE, CARD_Z0 - 4, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([LEDGE.x + 3, LEDGE.y + LEDGE.d / 2, CARD_Z0 + 1]), at([LEDGE.x + LEDGE.w - 3, LEDGE.y + LEDGE.d / 2, CARD_Z0 + 1])], { size: 0.45, tone: "mid" }));
  // Tiang penyangga ledge (dua kaki kecil)
  for (const x of [LEDGE.x + 6, LEDGE.x + LEDGE.w - 8]) {
    out.push(S(k.slabOf({ x, y: LEDGE.y + 0.8, w: 2.4, d: 2.4, r: 0.6 }, 4, CARD_Z0 - 8, P, 2), { tone: "mid" }));
  }
  return out.join("");
}

/** Berkas sinar dari kamera ke empat sudut QR (digambar sebelum HP agar ujungnya tertutup badan HP). */
export const BEAM = (() => {
  const corners: k.Point3[] = [
    [QR_BOX.x0, CARD_FACE, QR_BOX.z1],
    [QR_BOX.x1, CARD_FACE, QR_BOX.z1],
    [QR_BOX.x1, CARD_FACE, QR_BOX.z0],
    [QR_BOX.x0, CARD_FACE, QR_BOX.z0],
  ];
  const cam = at(CAMERA);
  const pts = corners.map((c) => at(c));
  return {
    rays: pts.map((p) => k.pathOf([cam, p])).join(""),
    frame: k.pathOf(pts, true),
    cam,
    /** Garis pindai pada bidang kartu, koordinat lokal (x, −z); digeser oleh live. */
    scanLine: `M${QR_BOX.x0 - 1} 0H${QR_BOX.x1 + 1}`,
    cardPlane: planeOf(CARD_FACE + 0.05),
  };
})();

function cradle() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(CRADLE, 0, 6, P)}"/>`);
  out.push(S(k.slabOf(CRADLE, 0, CRADLE_H, P, 6, 1), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(CRADLE, 2.6), CRADLE_H, P, 6), { tone: "faint" }));
  out.push(S(k.slabOf(JAW_BACK, CRADLE_H, JAW_BACK_H, P, 3, 0.6), { tone: "mid" }));
  out.push(D([at([JAW_BACK.x + 4, JAW_BACK.y + 4, CRADLE_H + JAW_BACK_H]), at([JAW_BACK.x + JAW_BACK.w - 4, JAW_BACK.y + 4, CRADLE_H + JAW_BACK_H])], { size: 0.45, tone: "mid" }));
  return out.join("");
}

function cradleFront() {
  const out: string[] = [];
  out.push(S(k.slabOf(JAW_FRONT, CRADLE_H, JAW_FRONT_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(JAW_FRONT, CRADLE_H + 3, P, 3), { tone: "faint" }) }));
  // Bantalan karet di mulut rahang
  out.push(S(k.slabOf({ x: JAW_FRONT.x + 4, y: JAW_FRONT.y, w: JAW_FRONT.w - 8, d: 1.4, r: 0.6 }, CRADLE_H + JAW_FRONT_H, 1.2, P, 2), { tone: "lo", crease: "none" }));
  // Sekrup pengunci knurl di ujung kanan cradle
  const knob: [number, number] = [CRADLE.x + CRADLE.w - 2, CRADLE.y + CRADLE.d - 6];
  out.push(S(k.cylinder(knob[0], knob[1], 3, CRADLE_H, 3, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(knob[0], knob[1], 5.4, CRADLE_H + 3, 6, P, 32, 0.5), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 5.4, CRADLE_H + 3, CRADLE_H + 9, 26, P), { tone: "lo" }));
  out.push(D([at([knob[0], knob[1], CRADLE_H + 9])], { size: 0.55, tone: "hi" }));
  // Lubang kabel di depan cradle (port USB-C)
  out.push(
    `<g transform="${planeOf(CRADLE.y + CRADLE.d)}"><path class="iso-line" data-tone="lo" d="${flat(-7, 2, 7, 4.6, 1.3, 4)}"/></g>`
  );
  return out.join("");
}

/** Badan HP: sisi, tombol samping, speaker; layar dibuat dinamis oleh live. */
function phoneBody() {
  const out: string[] = [];
  out.push(
    S(k.slabOf(PHONE, PHONE_Z0, PHONE_Z1 - PHONE_Z0, P, 6, 1.2), {
      tone: "hi",
      crease: "lo",
      inner: L(
        // Garis bingkai atas/bawah + jalur antena melingkari badan
        [PHONE_Z1 - 1.6, PHONE_Z1 - 14, PHONE_Z0 + 16, PHONE_Z0 + 1.6].map((z) => k.sideSeam(PHONE, z, P, 6)).join(""),
        { tone: "faint" }
      ),
    })
  );
  // Tombol volume & daya di sisi kanan (+x)
  for (const [z0, z1] of [[118, 132], [98, 112], [76, 86]]) {
    out.push(S(k.slabOf({ x: PHONE_SIDE - 0.2, y: PHONE.y + 2.6, w: 1.4, d: 3.8, r: 0.6 }, z0, z1 - z0, P, 2), { tone: "mid", crease: "none" }));
  }
  // Slot SIM
  out.push(L(sideSlot(PHONE_SIDE, PHONE.y + 4.5, 52, 64, 0.9), { tone: "lo" }));
  // Grill speaker di sisi atas
  out.push(D(k.dotGrid(-8, PHONE.y + 4.5, 7, 1, 2.4, PHONE_Z1, P), { size: 0.45, tone: "mid" }));
  return out.join("");
}

const bezel = recess(BEZEL, FRONT, "sp-bezel");
export const SCREEN = recess(GLASS, FRONT - BEZEL.depth, "sp-glass");

/** Bagian layar statis: earpiece & kamera depan di bezel. */
const bezelBits =
  `<g transform="${planeOf(FRONT - BEZEL.depth)}">` +
  `<path class="iso-line" data-tone="lo" d="${flat(-7, 149.5, 7, 151.3, 0.9, 3)}"/>` +
  `</g>`;

// ---------- Susunan statis (urutan pelukis: belakang → depan) ----------
const BASE_PLATE = { x: BASE.x, y: BASE.y, w: BASE.w, d: BASE.d, r: BASE.r };
export const ART_BACK = [
  basePlate(BASE_PLATE, BASE_H, FOOT_H),
  ruler({ x: BASE.x + 14, y: BASE.y + BASE.d - 14, w: 112, d: 7, r: 1 }),
  labelPlate({ x: BASE.x + BASE.w - 54, y: BASE.y + BASE.d - 15, w: 40, d: 9, r: 1.2 }),
  easelAndCard(),
].join("");

export const ART_PHONE = [cradle(), phoneBody(), bezel.defs, `<g clip-path="url(#${bezel.id})">${bezel.walls}<g transform="${bezel.backPlane}">${bezel.back}</g></g>`, bezel.rim, bezelBits, SCREEN.defs, `<g clip-path="url(#${SCREEN.id})">${SCREEN.walls}</g>`].join("");

export const ART_FRONT = [SCREEN.rim, cradleFront()].join("");
