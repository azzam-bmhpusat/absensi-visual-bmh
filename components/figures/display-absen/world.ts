import * as k from "@/components/iso/iso-kit";
import type { Flat, Plan, Projection } from "@/components/iso/iso-kit";
import { toolsFor } from "../shared";
import { chairArt, deskArt, seatedArt, standingArt, type HeadKind } from "./person";
import {
  AZIMUTH,
  DECK_D,
  ELEVATION,
  PITCH_Y,
  RISE,
  SIDE,
  STAGE_D,
  STAGE_H,
  TRUSS_Z,
  WALL_H,
  seatPos,
  slotOfY,
  yBackOf,
  yFrontOf,
  zDeckOf,
  gatePos,
  stairOf,
  STEP_W,
  type HallPlan,
  type V3,
} from "@/lib/display-absen-model";

export const VIEW_H = 1080;
const KINDS: HeadKind[] = [0, 1];

interface Prop {
  /** kedalaman (y) tempat benda digambar */
  y: number;
  html: string;
}

export interface WorldLamp {
  at: V3;
  screen: Flat;
}

export interface World {
  W: number;
  H: number;
  P: Projection;
  plan: HallPlan;
  defs: string;
  /** lantai, panggung, dinding + jendela */
  back1: string;
  /** isi panggung (podium, pembicara, truss, lampu, pengeras suara) */
  back2: string;
  /** per baris: pelat tribun + properti sayap yang jatuh di slot baris itu */
  rowBase: string[];
  /** teras belakang + gerbang */
  deck: string;
  seatOff: Flat[];
  tagPlane: string;
  led: { plane: string; x0: number; x1: number; z0: number; z1: number };
  clock: { plane: string; cx: number; cz: number; r: number };
  gauge: { plane: string; cx: number; cz: number; r: number };
  lamps: WorldLamp[];
  /** titik layar mutlak dari koordinat dunia */
  at: (p: V3) => Flat;
  off: (x: number, y: number, z: number) => Flat;
  floorScreen: (x: number, y: number, z: number) => Flat;
  gate: V3;
  ledGlass: string;
  stageW: number;
  /** pengubah id <use> orang dewasa */
  ids: { chairBase: string; chairBack: string };
}

const f1 = (n: number) => n.toFixed(1);

export function buildWorld(plan: HallPlan): World {
  const { rows, blockW, floorW } = plan;
  const W = Math.round(VIEW_H * plan.aspect);
  const yBack = yBackOf();
  const yFront = yFrontOf(rows);
  const zDeck = zDeckOf(rows);
  const aud = blockW + SIDE * 2;
  const stageW = Math.max(aud, floorW - 2 * 130);
  const FLOOR: Plan = { x: -floorW / 2, y: yBack - 14, w: floorW, d: yFront - yBack + 28, r: 10 };

  const points: Array<[number, number, number]> = [...k.boxCorners(FLOOR, -14, 0)];
  for (const x of [-floorW / 2, floorW / 2]) {
    points.push([x, yBack + 20, TRUSS_Z + 12]);
    points.push([x, yFront, zDeck + 52]);
  }
  const P = k.fitProjection(points, W, VIEW_H, { pad: 8, azimuth: AZIMUTH, elevation: ELEVATION });
  const T = toolsFor(P, "ab");
  const { at, S, L, planeOf } = T;
  const at0 = at([0, 0, 0]);
  const off = (x: number, y: number, z: number): Flat => {
    const p = at([x, y, z]);
    return [p[0] - at0[0], p[1] - at0[1]];
  };
  const place = (id: string, x: number, y: number, z: number, style = "") => {
    const [dx, dy] = off(x, y, z);
    const cls = id.startsWith("ab-p") ? ' class="ab-live"' : "";
    return `<g transform="translate(${f1(dx)} ${f1(dy)})"><use href="#${id}"${cls}${style ? ` style="${style}"` : ""}/></g>`;
  };
  const look = (sk: string, cl: string, hr: string, ac: string) => `--sk:${sk};--cl:${cl};--hr:${hr};--ac:${ac}`;
  const faceText = (y: number, x: number, z: number, text: string, size: number, cls = "da-ink", anchor = "middle") =>
    `<g transform="${planeOf(y)}"><text class="${cls}" x="${f1(x)}" y="${f1(-z)}" font-size="${size}" text-anchor="${anchor}">${text}</text></g>`;

  // ---------- defs: kursi & sosok sekali jadi ----------
  const chair = chairArt(P, T);
  const defs: string[] = [`<g id="ab-chair-b">${chair.base}</g>`, `<g id="ab-chair-k">${chair.back}</g>`];
  for (const kind of KINDS) {
    const seated = seatedArt(P, T, kind);
    defs.push(`<g id="ab-ps${kind}">${seated.body}<g class="ab-hdb">${seated.back}</g><g class="ab-hdf">${seated.face}</g></g>`);
    for (const step of [-1, 0, 1] as const) {
      const walker = standingArt(P, T, kind, step);
      defs.push(`<g id="ab-pw${kind}${step + 1}">${walker.body}${walker.back}</g>`);
    }
    const presenter = standingArt(P, T, kind, 0, "down");
    defs.push(`<g id="ab-pp${kind}">${presenter.body}${presenter.face}</g>`);
    defs.push(`<g id="ab-pd${kind}">${deskArt(P, T, kind, 8)}</g>`);
    defs.push(`<g id="ab-pr${kind}">${deskArt(P, T, kind, 13)}</g>`);
  }
  defs.push(
    `<linearGradient id="ab-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d06b" stop-opacity="0.32"/><stop offset="1" stop-color="#f2d06b" stop-opacity="0.07"/></linearGradient>`
  );

  // ---------- Lantai ----------
  const floor: string[] = [T.basePlate(FLOOR, 9, 5)];
  for (let x = Math.ceil((FLOOR.x + 30) / 40) * 40; x < FLOOR.x + FLOOR.w - 20; x += 40) {
    floor.push(L(k.lineOnTop([x, FLOOR.y + 4.5], [x, FLOOR.y + FLOOR.d - 4.5], 0, P), { tone: "faint" }));
  }
  for (let y = Math.ceil((FLOOR.y + 30) / 40) * 40; y < FLOOR.y + FLOOR.d - 20; y += 40) {
    floor.push(L(k.lineOnTop([FLOOR.x + 4.5, y], [FLOOR.x + FLOOR.w - 4.5, y], 0, P), { tone: "faint" }));
  }
  floor.push(T.labelPlate({ x: FLOOR.x + 12, y: FLOOR.y + FLOOR.d - 26, w: 42, d: 9, r: 1.2 }));
  floor.push(T.ruler({ x: FLOOR.x + FLOOR.w - 130, y: FLOOR.y + FLOOR.d - 20, w: 110, d: 6, r: 1 }));

  // ---------- Panggung ----------
  const STAGE: Plan = { x: -stageW / 2, y: yBack, w: stageW, d: STAGE_D, r: 3 };
  const stage: string[] = [];
  stage.push(S(k.slabOf(STAGE, 0, STAGE_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(STAGE, STAGE_H - 2.4, P, 4), { tone: "faint" }) }));
  stage.push(L(k.planOutline(k.insetPlan(STAGE, 5), STAGE_H, P, 4), { tone: "faint" }));
  const boards: string[] = [];
  for (let x = Math.ceil((STAGE.x + 12) / 24) * 24; x < STAGE.x + STAGE.w - 8; x += 24) boards.push(k.lineOnTop([x, STAGE.y + 5], [x, STAGE.y + STAGE.d - 5], STAGE_H, P));
  stage.push(L(boards.join(""), { tone: "faint" }));
  for (const [i, h] of [[1, 6.6], [0, 3.3]] as const) {
    const step: Plan = { x: -26, y: STAGE.y + STAGE.d + (1 - i) * 5.5, w: 52, d: 5.5, r: 0.8 };
    stage.push(S(k.slabOf(step, 0, h, P, 2), { tone: "mid" }));
  }

  // dinding belakang
  const WALLP: Plan = { x: STAGE.x + 4, y: STAGE.y + 3, w: stageW - 8, d: 5, r: 1 };
  const yW = WALLP.y + WALLP.d;
  const wallTop = STAGE_H + WALL_H;
  stage.push(S(k.slabOf(WALLP, STAGE_H, WALL_H, P, 2, 0.6), { tone: "mid", inner: L(k.sideSeam(WALLP, wallTop - 6, P, 2), { tone: "faint" }) }));
  for (const px of [WALLP.x, WALLP.x + WALLP.w - 7]) {
    stage.push(S(k.slabOf({ x: px, y: yW, w: 7, d: 3.2, r: 0.6 }, STAGE_H, WALL_H + 6, P, 2, 0.4), { tone: "lo" }));
  }

  // jendela: LED tengah, jam kiri, indikator kanan
  const R = 27;
  const ledW = Math.min(stageW - 2 * (2 * R + 26), 330);
  const ledZ0 = STAGE_H + 11;
  const ledZ1 = wallTop - 11;
  const cz = (ledZ0 + ledZ1) / 2;
  const gx = ledW / 2 + R + 10;
  const ledR = T.recess({ x0: -ledW / 2, x1: ledW / 2, z0: ledZ0, z1: ledZ1, r: 3, depth: 2.4 }, yW, "da-glass");
  const clockR = T.recess({ x0: -gx - R, x1: -gx + R, z0: cz - R, z1: cz + R, r: R, depth: 2.2 }, yW, "da-glass");
  const gaugeR = T.recess({ x0: gx - R, x1: gx + R, z0: cz - R, z1: cz + R, r: R, depth: 2.2 }, yW, "da-glass");
  const recessArt = (r: ReturnType<typeof T.recess>) => `${r.defs}<g clip-path="url(#${r.id})">${r.walls}<g transform="${r.backPlane}">${r.back}${r.backRim}</g></g>${r.rim}`;
  stage.push(recessArt(ledR), recessArt(clockR), recessArt(gaugeR));
  const ticks: string[] = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r1 = R - 1.6;
    const r0 = r1 - (i % 5 === 0 ? 4 : 1.8);
    ticks.push(`M${f1(-gx + Math.sin(a) * r0)} ${f1(-(cz + Math.cos(a) * r0))}L${f1(-gx + Math.sin(a) * r1)} ${f1(-(cz + Math.cos(a) * r1))}`);
  }
  stage.push(`<g transform="${clockR.backPlane}"><path class="iso-line" data-tone="mid" d="${ticks.join("")}"/></g>`);

  // ---------- Isi panggung (digambar setelah layar LED) ----------
  const s2: string[] = [];
  const trussY = STAGE.y + 24;
  const lampXs = Array.from({ length: 5 }, (_, i) => -stageW / 2 + 22 + ((stageW - 44) * i) / 4);
  for (const px of [-stageW / 2 + 8, stageW / 2 - 8]) s2.push(S(k.cylinder(px, trussY, 2.2, STAGE_H, TRUSS_Z - STAGE_H, P, 10), { tone: "lo" }));
  const bar: Plan = { x: -stageW / 2 + 4, y: trussY - 2.4, w: stageW - 8, d: 4.8, r: 1 };
  s2.push(S(k.slabOf(bar, TRUSS_Z, 4.4, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(bar, TRUSS_Z + 2.2, P, 3), { tone: "faint" }) }));
  const lamps: WorldLamp[] = [];
  for (const lx of lampXs) {
    s2.push(S(k.cylinder(lx, trussY + 4, 3.4, TRUSS_Z - 7.5, 7.5, P, 14, 0.4), { tone: "hi" }));
    s2.push(S(k.cylinder(lx, trussY + 4, 2.5, TRUSS_Z - 10, 2.5, P, 14), { tone: "hi", lit: true, crease: "none" }));
    const v: V3 = [lx, trussY + 4, TRUSS_Z - 10];
    lamps.push({ at: v, screen: at(v) });
  }
  // pengeras suara + monitor lantai
  for (const sx of [-stageW / 2 + 22, stageW / 2 - 22]) {
    const box: Plan = { x: sx - 8, y: STAGE.y + 22, w: 16, d: 13, r: 1.4 };
    s2.push(S(k.slabOf(box, STAGE_H, 34, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(box, STAGE_H + 28, P, 3), { tone: "faint" }) }));
    s2.push(L(k.sideRing([sx, box.y + box.d, STAGE_H + 12], 4.4, "y", P) + k.sideRing([sx, box.y + box.d, STAGE_H + 24], 2.6, "y", P), { tone: "lo" }));
  }
  for (const mx of [-stageW * 0.12, stageW * 0.12]) {
    const wedge: Plan = { x: mx - 8, y: STAGE.y + STAGE.d - 14, w: 16, d: 8, r: 1.2 };
    s2.push(S(k.slabOf(wedge, STAGE_H, 5, P, 3, 0.3), { tone: "lo" }));
  }
  // podium + pembicara (menghadap penonton)
  const px = Math.min(stageW * 0.3, ledW / 2 + 70);
  const py = STAGE.y + 64;
  s2.push(place("ab-pp0", px, py - 9, STAGE_H, look("#d3a077", "#e8e2cf", "#1b1410", "#2f9275")));
  const pod: Plan = { x: px - 11, y: py - 6, w: 22, d: 13, r: 2 };
  s2.push(S(k.slabOf(pod, STAGE_H, 26, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(pod, STAGE_H + 20, P, 3), { tone: "faint" }) }));
  s2.push(S(k.slabOf({ x: px - 12.5, y: py - 7.5, w: 25, d: 15, r: 2 }, STAGE_H + 26, 2, P, 3), { tone: "mid" }));
  s2.push(S(k.cylinder(px + 5, py - 1, 0.8, STAGE_H + 28, 8, P, 8), { tone: "lo", crease: "none" }));
  s2.push(S(k.cylinder(px + 5, py - 1, 1.8, STAGE_H + 36, 2.4, P, 12), { tone: "mid" }));
  // meja panelis: dua orang di balik meja + laptop
  const tx = -Math.min(stageW * 0.3, ledW / 2 + 70);
  const ty = STAGE.y + 64;
  s2.push(place("ab-pd1", tx - 14, ty - 7, STAGE_H + 2.4, look("#a8744c", "#4f86a8", "#0d0d0d", "#2f9275")));
  s2.push(place("ab-pd0", tx + 14, ty - 7, STAGE_H + 2.4, look("#e3b88f", "#c9a24a", "#2d1e14", "#d9f1e7")));
  const table: Plan = { x: tx - 28, y: ty - 3, w: 56, d: 12, r: 1.6 };
  s2.push(S(k.slabOf(table, STAGE_H + 8.6, 1.8, P, 3, 0.4), { tone: "mid" }));
  s2.push(S(k.slabOf({ x: tx - 27, y: ty - 2, w: 54, d: 1.6, r: 0.4 }, STAGE_H, 8.6, P, 2), { tone: "lo" }));
  for (const lxp of [tx - 14, tx + 14]) {
    s2.push(S(k.slabOf({ x: lxp - 6, y: ty - 1, w: 12, d: 8, r: 0.8 }, STAGE_H + 10.4, 0.8, P, 3), { tone: "lo" }));
    s2.push(S(k.slabOf({ x: lxp - 6, y: ty - 1.2, w: 12, d: 0.9, r: 0.3 }, STAGE_H + 11.2, 7, P, 2), { tone: "mid" }));
  }
  s2.push(T.labelPlate({ x: tx - 10, y: ty + 3.4, w: 20, d: 5, r: 0.8 }, STAGE_H + 8.6 + 0.4 - 0.4));

  // ---------- Tribun ----------
  const rowBase: string[] = [];
  const slabW = blockW + SIDE * 2;
  for (let r = 0; r < rows; r++) {
    const slab: Plan = { x: -slabW / 2, y: r * PITCH_Y, w: slabW, d: PITCH_Y, r: 0.8 };
    rowBase.push(S(k.slabOf(slab, 0, (r + 1) * RISE, P, 3), { tone: "lo", crease: "none" }));
  }
  const deckPlan: Plan = { x: -slabW / 2, y: rows * PITCH_Y, w: slabW, d: DECK_D, r: 0.8 };
  const deck: string[] = [S(k.slabOf(deckPlan, 0, zDeck, P, 3), { tone: "lo", crease: "none" })];
  deck.push(L(k.planOutline(k.insetPlan(deckPlan, 3), zDeck, P, 3), { tone: "faint" }));
  // gerbang masuk
  // tangga di sisi kiri teras: lantai aula -> teras (anak tangga makin tinggi ke arah teras)
  const st = stairOf(plan);
  for (let i = 0; i < st.steps; i++) {
    const h = Math.min(st.top, (i + 1) * RISE);
    deck.push(S(k.slabOf({ x: st.edgeX - (i + 1) * STEP_W, y: st.y - 7, w: STEP_W + 0.4, d: 14, r: 0.3 }, 0, h, P, 2, 0.2), { tone: i % 2 ? "mid" : "lo" }));
  }
  // gerbang masuk berdiri di lantai aula, di depan kaki tangga
  const gate = gatePos(plan);
  const gy = gate[1];
  const mat: Plan = { x: gate[0] - 8, y: st.y - 7, w: 16, d: gy - st.y + 13, r: 1 };
  deck.push(S(k.slabOf(mat, 0, 0.5, P, 3), { tone: "mid", className: "ab-mat", crease: "none" }));
  for (const sx of [-8, 8]) {
    deck.push(S(k.slabOf({ x: gate[0] + sx - 2.6, y: gy - 2.8, w: 5.2, d: 5.6, r: 0.8 }, 0, 2.4, P, 2, 0.3), { tone: "lo" }));
    deck.push(S(k.slabOf({ x: gate[0] + sx - 1.8, y: gy - 2, w: 3.6, d: 4, r: 0.6 }, 2.4, 37.6, P, 2, 0.3), { tone: "mid" }));
  }
  const lintel: Plan = { x: gate[0] - 13, y: gy - 2.6, w: 26, d: 5.2, r: 0.8 };
  deck.push(S(k.slabOf(lintel, 39, 9, P, 2, 0.4), { tone: "mid" }));
  deck.push(`<g transform="${planeOf(gy + 2.65)}"><rect class="ab-banner" x="${f1(gate[0] - 11.5)}" y="${f1(-47)}" width="23" height="7" rx="0.8"/></g>`);
  deck.push(faceText(gy + 2.7, gate[0], 41.9, "MASUK", 4.4, "da-ink-gold"));

  // ---------- Kursi ----------
  const cap = plan.cols * plan.rows;
  const seatOff: Flat[] = [];
  for (let i = 0; i < cap; i++) {
    const s = seatPos(plan, i);
    seatOff.push(off(s.x, s.y, s.z));
  }
  const tagPlane = planeOf(6.75);

  // ---------- Properti sayap (tiap sisi), dimasukkan ke slot baris menurut kedalaman ----------
  const props: Prop[] = [];
  const inner = aud / 2 + 8;
  const outer = floorW / 2 - 12;
  const midX = (side: number) => side * ((inner + outer) / 2);
  const wingW = outer - inner;
  const depthAt = (f: number) => yBack + 22 + f * (yFront - 14 - (yBack + 22));
  // kipas angin berdiri: alas + tiang (iso), kepala menghadap penonton dengan bilah berputar & menoleh (CSS)
  let fanN = 0;
  const fan = (x: number, y: number, h = 34) => {
    const out = [S(k.cylinder(x, y, 6, 0, 1.6, P, 16, 0.6), { tone: "lo" })];
    out.push(S(k.cylinder(x, y, 0.9, 1.6, h - 6, P, 8), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(x, y, 2.2, h - 5.6, 3.2, P, 12, 0.6), { tone: "mid" }));
    const [cx, cy] = at([x, y + 1.6, h]);
    const r = 8.2 * k.cameraOf(P).k;
    const blades = [0, 120, 240]
      .map((a) => `<path class="ab-fan-blade" transform="rotate(${a})" d="M0 0C${f1(r * 0.25)} ${f1(-r * 0.2)} ${f1(r * 0.75)} ${f1(-r * 0.32)} ${f1(r * 0.82)} ${f1(-r * 0.05)}C${f1(r * 0.7)} ${f1(r * 0.18)} ${f1(r * 0.3)} ${f1(r * 0.12)} 0 0z"/>`)
      .join("");
    out.push(
      `<g transform="translate(${f1(cx)} ${f1(cy)})"><g class="ab-fan-head" style="--fd:${-(fanN++ * 2.3).toFixed(1)}s">` +
        `<circle class="ab-fan-back" r="${f1(r)}"/><g class="ab-fan-blades">${blades}</g>` +
        `<circle class="ab-fan-guard" r="${f1(r)}"/><circle class="ab-fan-guard" r="${f1(r * 0.6)}"/><circle class="ab-fan-hub" r="${f1(r * 0.16)}"/></g></g>`
    );
    return out.join("");
  };
  const speaker = (x: number, y: number, h: number) => {
    const box: Plan = { x: x - 8, y: y - 6.5, w: 16, d: 13, r: 1.4 };
    const out = [S(k.slabOf(box, 0, h, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(box, h - 6, P, 3), { tone: "faint" }) })];
    const rings: string[] = [];
    for (let z = 9; z < h - 6; z += 15) rings.push(k.sideRing([x, box.y + box.d, z + 3], 4.4, "y", P) + k.sideRing([x, box.y + box.d, z + 3], 2.2, "y", P));
    out.push(L(rings.join(""), { tone: "lo" }));
    return out.join("");
  };
  const crate = (x: number, y: number, w: number, d: number, h: number, z = 0) => {
    const box: Plan = { x: x - w / 2, y: y - d / 2, w, d, r: 0.8 };
    return S(k.slabOf(box, z, h, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(box, z + h * 0.5, P, 3), { tone: "faint" }) });
  };

  for (const side of [-1, 1] as const) {
    const xc = midX(side);
    // menara pengeras suara di samping panggung
    props.push({ y: STAGE.y + 24, html: speaker(xc, STAGE.y + 24, 54) });
    props.push({ y: STAGE.y + 60, html: crate(xc, STAGE.y + 60, 22, 14, 12) + crate(xc, STAGE.y + 60, 16, 10, 9, 12) });
    // tanaman penghias
    props.push({ y: depthAt(0.62), html: fan(xc + side * (wingW * 0.22), depthAt(0.62), 36) });
    // sisi kiri: gerbang & tangga ada di dekat tribun, jadi kipas & peti digeser ke tepi luar sayap
    props.push(
      side < 0
        ? { y: depthAt(0.97), html: fan(xc - wingW * 0.36, depthAt(0.97), 30) }
        : { y: depthAt(0.97), html: fan(xc - side * (wingW * 0.2), depthAt(0.97), 30) + crate(xc + side * (wingW * 0.12), depthAt(0.97), 20, 12, 10) }
    );
  }

  // kiri: kamera + meja mixer + operator
  {
    const xc = midX(-1);
    const cy = depthAt(0.2);
    const cam: string[] = [];
    for (const [dx, dy] of [[-7, 4], [7, 4], [0, -7]] as const) cam.push(S(k.cylinder(xc + dx, cy + dy, 1, 0, 5, P, 8), { tone: "lo", crease: "none" }));
    cam.push(S(k.cylinder(xc, cy, 1.6, 4, 24, P, 10), { tone: "mid" }));
    cam.push(S(k.slabOf({ x: xc - 6, y: cy - 10, w: 12, d: 20, r: 1.8 }, 27, 11, P, 4, 0.6), { tone: "hi", inner: L(k.sideSeam({ x: xc - 6, y: cy - 10, w: 12, d: 20, r: 1.8 }, 32, P, 4), { tone: "faint" }) }));
    cam.push(S(k.cylinder(xc, cy - 12.5, 3.4, 29, 4, P, 12), { tone: "lo", className: "ab-lens" }));
    cam.push(`<circle class="ab-tally" cx="${f1(at([xc + 3.2, cy + 8, 38.6])[0])}" cy="${f1(at([xc + 3.2, cy + 8, 38.6])[1])}" r="${f1(0.9 * k.cameraOf(P).k)}"/>`);
    props.push({ y: cy + 4, html: cam.join("") });

    const my = depthAt(0.46);
    const desk: Plan = { x: xc - 24, y: my - 10, w: 48, d: 20, r: 1.8 };
    const m: string[] = [S(k.slabOf(desk, 0, 11, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(desk, 5, P, 4), { tone: "faint" }) })];
    const riser: Plan = { x: xc - 22, y: my - 10, w: 44, d: 3.4, r: 0.8 };
    m.push(S(k.slabOf(riser, 11, 15, P, 2, 0.4), { tone: "lo" }));
    // meteran VU di muka riser
    const segs: string[] = [];
    const cols = 12;
    const rowsN = 7;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rowsN; r++) {
        const sx = xc - 19.2 + c * 3.5;
        const sz = 13 + r * 1.65;
        segs.push(`<rect class="ab-seg" data-c="${c}" data-r="${r}" x="${f1(sx)}" y="${f1(-(sz + 1.2))}" width="2.6" height="1.2"/>`);
      }
    }
    m.push(`<g transform="${planeOf(my - 10 + 3.4)}">${segs.join("")}</g>`);
    // fader & kenop
    for (let i = 0; i < 9; i++) {
      m.push(S(k.slabOf({ x: xc - 20 + i * 5, y: my - 5.6, w: 1.4, d: 8, r: 0.4 }, 11, 0.7, P, 2), { tone: "lo", crease: "none" }));
      m.push(S(k.slabOf({ x: xc - 20.6 + i * 5, y: my - 2 + (i % 3), w: 2.6, d: 1.8, r: 0.4 }, 11.7, 1.4, P, 2), { tone: "hi", lit: i % 4 === 0 }));
    }
    props.push({ y: my, html: m.join("") });
    const sitY = my + 17;
    props.push({
      y: sitY,
      html: [
        place("ab-chair-b", xc, sitY, 0),
        place("ab-ps1", xc, sitY, 0, look("#cf9a6e", "#2f9275", "#1b1410", "#d9f1e7") + ";--ph:-1.2s;--bob:4.6s"),
        place("ab-chair-k", xc, sitY, 0),
      ].join(""),
    });
  }

  // kanan: spanduk + meja registrasi + resepsionis + tiang QR
  {
    const xc = midX(1);
    const by = depthAt(0.2);
    // spanduk berdiri: kaki + panel; teks rata tengah dengan pemisah emas
    const ban: Plan = { x: xc - 15, y: by - 1.2, w: 30, d: 2.4, r: 0.6 };
    const b: string[] = [S(k.slabOf({ x: xc - 16, y: by - 3, w: 32, d: 6, r: 1 }, 0, 2.4, P, 3), { tone: "lo" })];
    b.push(S(k.slabOf(ban, 2.4, 74, P, 2, 0.4), { tone: "mid" }));
    const face = by + 1.25;
    b.push(`<g transform="${planeOf(face)}"><rect class="ab-banner" x="${f1(xc - 13)}" y="${f1(-74)}" width="26" height="68" rx="1"/>` +
      `<rect class="ab-banner-rule" x="${f1(xc - 8)}" y="${f1(-57.6)}" width="16" height="0.5"/>` +
      `<rect class="ab-banner-rule" x="${f1(xc - 8)}" y="${f1(-18.6)}" width="16" height="0.5"/></g>`);
    b.push(faceText(face, xc, 63, "RAKERNAS", 4.4, "da-ink-gold"));
    b.push(faceText(face, xc, 51, "BMH", 6.4, "da-ink"));
    b.push(faceText(face, xc, 44, "2027", 5.2, "da-ink-gold"));
    b.push(faceText(face, xc, 33, "SILATURAHIM &amp;", 2.2, "da-ink-dim"));
    b.push(faceText(face, xc, 29.6, "RAPAT KERJA", 2.2, "da-ink-dim"));
    b.push(faceText(face, xc, 26.2, "NASIONAL", 2.2, "da-ink-dim"));
    b.push(faceText(face, xc, 13, "Hall Utama", 2.4, "da-ink-dim"));
    props.push({ y: by + 2, html: b.join("") });

    const ry = depthAt(0.46);
    const recep: string[] = [place("ab-pr0", xc, ry - 7, 0, look("#e3b88f", "#d9f1e7", "#3b2a1c", "#4f86a8"))];
    const rdesk: Plan = { x: xc - 24, y: ry - 5, w: 48, d: 13, r: 1.6 };
    recep.push(S(k.slabOf(rdesk, 0, 13, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(rdesk, 6, P, 4), { tone: "faint" }) }));
    recep.push(S(k.slabOf({ x: xc - 8, y: ry - 2, w: 12, d: 7, r: 0.8 }, 13, 0.8, P, 3), { tone: "lo" }));
    recep.push(S(k.slabOf({ x: xc - 8, y: ry - 2.2, w: 12, d: 0.9, r: 0.3 }, 13.8, 7, P, 2), { tone: "mid" }));
    props.push({ y: ry + 6, html: recep.join("") });
  }
  // sebar properti ke slot masing-masing (y < 0 → belakang, di samping panggung)
  const slots: string[][] = Array.from({ length: rows + 1 }, () => []);
  const sideStage: string[] = [];
  for (const p of props.sort((a, b) => a.y - b.y)) {
    if (p.y < 0) sideStage.push(p.html);
    else slots[slotOfY(p.y, rows)].push(p.html);
  }
  for (let r = 0; r < rows; r++) rowBase[r] += slots[r].join("");
  const deckHtml = deck.join("") + slots[rows].join("");

  const ledPlane = ledR.backPlane;
  return {
    W,
    H: VIEW_H,
    P,
    plan,
    defs: defs.join(""),
    back1: floor.join("") + sideStage.join("") + stage.join(""),
    back2: s2.join(""),
    rowBase,
    deck: deckHtml,
    seatOff,
    tagPlane,
    led: { plane: ledPlane, x0: -ledW / 2, x1: ledW / 2, z0: ledZ0, z1: ledZ1 },
    clock: { plane: clockR.backPlane, cx: -gx, cz, r: R },
    gauge: { plane: gaugeR.backPlane, cx: gx, cz, r: R },
    lamps,
    at,
    off,
    floorScreen: (x, y, z) => at([x, y, z]),
    gate,
    ledGlass: "",
    stageW,
    ids: { chairBase: "ab-chair-b", chairBack: "ab-chair-k" },
  };
}
