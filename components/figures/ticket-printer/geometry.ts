import * as k from "@/components/iso/iso-kit";
import type { Plan } from "@/components/iso/iso-kit";
import { toolsFor } from "../shared";

/**
 * Fig 2 · Tiket Kedatangan — printer struk thermal di atas pelat dasar.
 * Tiket peserta terbaru naik tegak dari celah kertas; tiket sebelumnya tertumpuk di nampan depan.
 */

export const WIDTH = 360;
export const HEIGHT = 390;
export const AZIMUTH = 50;

const BASE: Plan = { x: -92, y: -84, w: 184, d: 168, r: 9 };
const BASE_H = 8;
const FOOT_H = 5;

const BODY: Plan = { x: -58, y: -66, w: 116, d: 76, r: 8 };
const BODY_H = 46;
const FRONT = BODY.y + BODY.d;
const SIDE = BODY.x + BODY.w;
const LID: Plan = { x: -54, y: -62, w: 108, d: 44, r: 6 };
const LID_H = 13;

// Tiket tegak di celah kertas
export const SLOT_Y = -15;
export const TICKET = { x0: -36, x1: 36, z0: BODY_H, z1: BODY_H + 76, t: 0.8 };
export const TICKET_FACE = SLOT_Y;
const TEAR: Plan = { x: -44, y: SLOT_Y + 0.6, w: 88, d: 3, r: 1 };

// Panel kontrol di dek depan
export const LED: k.Point3 = [32, -3, BODY_H];
const LED2: k.Point3 = [41, -3, BODY_H];
const FEED: [number, number] = [-34, -2.5];

// Nampan tiket di depan printer
const TRAY: Plan = { x: -58, y: 20, w: 116, d: 56, r: 3 };
const TRAY_H = 2.6;
const LIP_H = 6;

export const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), ...k.boxCorners(BODY, 0, BODY_H + LID_H), [TICKET.x0, SLOT_Y, TICKET.z1], [TICKET.x1, SLOT_Y, TICKET.z1]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: AZIMUTH }
);

const T = toolsFor(P, "tp");
const { at, S, L, D, planeOf, flat, sideSlot, basePlate, labelPlate } = T;

function printerBody() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(BODY, 0, 10, P)}"/>`);
  // Bantalan karet di bawah badan
  out.push(S(k.slabOf(k.insetPlan(BODY, 3), 0, 3, P, 6), { tone: "lo" }));
  out.push(
    S(k.slabOf(BODY, 3, BODY_H - 3, P, 8, 1.2), {
      tone: "mid",
      inner: L(k.sideSeam(BODY, 10, P, 8), { tone: "faint" }),
    })
  );
  // Ventilasi di sisi kanan (+x)
  const vents: string[] = [];
  for (let y = BODY.y + 12; y <= BODY.y + 50; y += 3.6) vents.push(sideSlot(SIDE, y, 18, 36));
  out.push(L(vents.join(""), { tone: "faint" }));
  // Plat nama di muka depan
  out.push(
    `<g transform="${planeOf(FRONT)}">` +
      `<path class="iso-line" data-tone="lo" d="${flat(-46, 16, -6, 32, 1.6, 4)}"/>` +
      [0, 1, 2].map((i) => `<path class="iso-line" data-tone="lo" data-free="" d="M-42 ${-(28 - i * 4)}H${-42 + [28, 18, 24][i]}"/>`).join("") +
      `</g>`
  );
  out.push(D([at([-9, FRONT, 24])], { size: 0.45, tone: "mid" }));
  // Port kabel daya di muka depan kanan
  out.push(`<g transform="${planeOf(FRONT)}"><path class="iso-line" data-tone="lo" d="${flat(28, 18, 44, 24, 2.4, 4)}"/></g>`);
  out.push(D([at([31, FRONT, 21]), at([36, FRONT, 21]), at([41, FRONT, 21])], { size: 0.45, tone: "mid" }));
  // Penutup gulungan kertas (lid) + kenop
  out.push(
    S(k.slabOf(LID, BODY_H, LID_H, P, 6, 1), {
      tone: "mid",
      inner: L(k.sideSeam(LID, BODY_H + 2.2, P, 6), { tone: "faint" }),
    })
  );
  out.push(L(k.planOutline(k.insetPlan(LID, 4), BODY_H + LID_H, P, 6), { tone: "faint" }));
  // Jendela kertas di tutup (garis lengkung gulungan di baliknya)
  const win: Plan = { x: -30, y: -54, w: 60, d: 16, r: 3 };
  out.push(S(k.slabOf(win, BODY_H + LID_H, 0.6, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(win, 1.6), BODY_H + LID_H + 0.6, P, 4), { tone: "faint" }));
  const knob: [number, number] = [40, -40];
  out.push(S(k.cylinder(knob[0], knob[1], 7.5, BODY_H + LID_H, 1.4, P, 32), { tone: "lo" }));
  out.push(S(k.cylinder(knob[0], knob[1], 6, BODY_H + LID_H + 1.4, 6, P, 32, 0.5), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 6, BODY_H + LID_H + 1.4, BODY_H + LID_H + 7.4, 28, P), { tone: "lo" }));
  out.push(D([at([knob[0], knob[1], BODY_H + LID_H + 7.4])], { size: 0.55, tone: "hi" }));
  // Sekrup sudut tutup
  out.push(D(k.corners(LID, 5).map(([x, y]) => at([x, y, BODY_H + LID_H])), { size: 0.45, tone: "mid" }));
  return out.join("");
}

/** Dek depan: tombol feed, LED, garis panel. LED nyala dibuat dinamis. */
function deck() {
  const out: string[] = [];
  const panel: Plan = { x: -48, y: SLOT_Y + 5, w: 96, d: 18, r: 3 };
  out.push(L(k.planOutline(panel, BODY_H, P, 6), { tone: "faint" }));
  out.push(S(k.cylinder(FEED[0], FEED[1], 6.2, BODY_H, 1, P, 32), { tone: "lo" }));
  out.push(S(k.cylinder(FEED[0], FEED[1], 4.8, BODY_H + 1, 2.2, P, 32, 0.5), { tone: "mid" }));
  out.push(L(k.ring(FEED[0], FEED[1], 2.4, BODY_H + 3.2, P, 24), { tone: "faint" }));
  out.push(L(k.ring(LED[0], LED[1], 2.6, BODY_H, P, 20) + k.ring(LED2[0], LED2[1], 2.6, BODY_H, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(LED2[0], LED2[1], 1.7, BODY_H, 1, P, 20), { tone: "lo", crease: "none" }));
  return out.join("");
}

/** Bilah sobek bergerigi di depan celah kertas. */
function tearBar() {
  const out: string[] = [];
  out.push(S(k.slabOf(TEAR, BODY_H, 2.4, P, 3, 0.4), { tone: "mid" }));
  const teeth: k.Flat[] = [];
  for (let x = TEAR.x + 3; x <= TEAR.x + TEAR.w - 3; x += 2.4) teeth.push(at([x, TEAR.y + 0.4, BODY_H + 2.4]));
  out.push(D(teeth, { size: 0.35, tone: "mid" }));
  out.push(D([at([TEAR.x + 1.6, TEAR.y + 1.5, BODY_H + 2.4]), at([TEAR.x + TEAR.w - 1.6, TEAR.y + 1.5, BODY_H + 2.4])], { size: 0.45, tone: "hi" }));
  return out.join("");
}

function trayBack() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(TRAY, 0, 4, P)}"/>`);
  out.push(S(k.slabOf(TRAY, 0, TRAY_H, P, 4, 0.6), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 6), TRAY_H, P, 4), { tone: "faint" }));
  out.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y, w: 4, d: TRAY.d, r: 1.2 }, TRAY_H, LIP_H, P, 3), { tone: "mid" }));
  return out.join("");
}

function trayFront() {
  const out: string[] = [];
  out.push(S(k.slabOf({ x: TRAY.x + TRAY.w - 4, y: TRAY.y, w: 4, d: TRAY.d, r: 1.2 }, TRAY_H, LIP_H, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y + TRAY.d - 4, w: TRAY.w, d: 4, r: 1.2 }, TRAY_H, LIP_H, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([TRAY.x + 6, TRAY.y + TRAY.d - 2, TRAY_H + LIP_H]), at([TRAY.x + TRAY.w - 6, TRAY.y + TRAY.d - 2, TRAY_H + LIP_H])], { size: 0.45, tone: "mid" }));
  return out.join("");
}

/** Empat slot tiket di nampan (paling bawah = paling lama). */
export const TRAY_SLOTS = [3, 2, 1, 0].map((i) => {
  // Tumpukan bergeser ke belakang supaya nama tiket yang lebih lama tetap mengintip
  const plan: Plan = { x: -40 + (3 - i) * 1.2, y: 24 + (3 - i) * 7.6, w: 76, d: 24, r: 1 };
  const z = TRAY_H + (3 - i) * 0.7;
  const top = z + 0.6;
  return {
    /** indeks di daftar `latest` (1 = sebelumnya, 4 = paling lama) */
    index: i + 1,
    solid: S(k.slabOf(plan, z, 0.6, P, 2), { tone: "hi", crease: "none" }),
    rule: L(k.lineOnTop([plan.x, plan.y + 8.6], [plan.x + plan.w, plan.y + 8.6], top, P), { tone: "faint" }),
    name: k.topMatrix([plan.x + 4, plan.y + 5.8], top, P, "x"),
    daerah: k.topMatrix([plan.x + 4, plan.y + 14.4], top, P, "x"),
    time: k.topMatrix([plan.x + plan.w - 4, plan.y + 20.6], top, P, "x"),
  };
});

/** Tiket tegak: badan tipis + bidang mukanya; dinaikkan oleh live (translate z). */
export const TICKET_ART = {
  solid: S(k.slabOf({ x: TICKET.x0, y: SLOT_Y - TICKET.t, w: TICKET.x1 - TICKET.x0, d: TICKET.t, r: 0.3 }, TICKET.z0, TICKET.z1 - TICKET.z0, P, 2), { tone: "hi", crease: "lo", lit: true }),
  plane: planeOf(TICKET_FACE + 0.02),
  /** Klip: hanya bagian di atas dek yang terlihat. */
  clipId: "tp-ticket-clip",
  clip: `<clipPath id="tp-ticket-clip"><path d="${k.pathOf(
    [
      at([TICKET.x0 - 2, SLOT_Y, BODY_H]),
      at([TICKET.x1 + 2, SLOT_Y, BODY_H]),
      at([TICKET.x1 + 2, SLOT_Y - 1.2, BODY_H]),
      at([TICKET.x1 + 2, SLOT_Y - 1.2, BODY_H + 400]),
      at([TICKET.x0 - 2, SLOT_Y, BODY_H + 400]),
    ],
    true
  )}"/></clipPath>`,
  /** Satu satuan z di layar, untuk translate saat naik. */
  rise: k.axisVector(P, [0, 0, 1]),
};

export const LED_AT = at(LED);

const BASE_PLATE = BASE;
export const ART_BACK = [
  basePlate(BASE_PLATE, BASE_H, FOOT_H),
  labelPlate({ x: BASE.x + 10, y: BASE.y + 12, w: 40, d: 9, r: 1.2 }),
  printerBody(),
  deck(),
].join("");

export const ART_MID = tearBar();
export const ART_TRAY_BACK = trayBack();
export const ART_TRAY_FRONT = trayFront();
