import * as k from "@/components/iso/iso-kit";
import type { Plan, Projection } from "@/components/iso/iso-kit";
import type { SeatLayout } from "@/lib/display-anatomy-model";
import { toolsFor } from "../../shared";

/**
 * Fig 1 · Aula — lantai aula di atas pelat berkaki, panggung dengan podium & latar di belakang,
 * satu kursi per tamu terdaftar. Kursi yang tamunya hadir diisi sosok duduk.
 * Geometri bergantung pada jumlah tamu, jadi dibangun per tata letak (useMemo di klien).
 */

export const WIDTH = 420;
export const HEIGHT = 400;
const AZIMUTH = 48;

const PITCH_X = 22;
const PITCH_Y = 27;
const AISLE = 12;
const SEAT_W = 16;
const SEAT_D = 13;

export interface HallSeat {
  index: number;
  /** kursi kosong */
  empty: string;
  /** sosok duduk (biasa / sorot) */
  person: string;
  personLit: string;
  /** titik tengah layar untuk area sentuh */
  hit: k.Flat;
  hitR: number;
  /** cincin di lantai sekeliling kursi (penanda fokus) */
  ring: string;
}

export interface HallArt {
  P: Projection;
  back: string;
  seats: HallSeat[];
  front: string;
}

export function buildHall(layout: SeatLayout): HallArt {
  const { cols, rows } = layout;
  const half = Math.ceil(cols / 2);
  const width = cols * PITCH_X + AISLE;
  const x0 = -width / 2;
  const seatX = (col: number) => x0 + col * PITCH_X + (col >= half ? AISLE : 0) + (PITCH_X - SEAT_W) / 2;
  const STAGE_D = 46;
  const seatsY0 = 18;
  const seatY = (row: number) => seatsY0 + row * PITCH_Y;
  const floorD = STAGE_D + 24 + rows * PITCH_Y + 16;
  const FLOOR: Plan = { x: x0 - 16, y: -STAGE_D - 12, w: width + 32, d: floorD + 12, r: 8 };
  const STAGE: Plan = { x: x0 - 4, y: -STAGE_D - 6, w: width + 8, d: STAGE_D, r: 3 };
  const STAGE_H = 9;
  const WALL: Plan = { x: x0 - 4, y: -STAGE_D - 10, w: width + 8, d: 4, r: 1 };
  const WALL_H = 74;

  const P = k.fitProjection(
    [...k.boxCorners(FLOOR, -14, 0), ...k.boxCorners(WALL, 0, WALL_H)],
    WIDTH,
    HEIGHT,
    { pad: 14, azimuth: AZIMUTH }
  );
  const T = toolsFor(P, "hall");
  const { at, S, L, D, planeOf, flat } = T;

  const back: string[] = [];
  back.push(T.basePlate(FLOOR, 9, 5));
  // Lorong tengah (garis karpet) di lantai
  const aisleX = x0 + half * PITCH_X + AISLE / 2;
  back.push(L(k.planOutline({ x: aisleX - 4, y: seatsY0 - 8, w: 8, d: rows * PITCH_Y + 6, r: 1 }, 0, P, 3), { tone: "faint" }));
  // Latar panggung + spanduk terukir
  back.push(S(k.slabOf(WALL, 0, WALL_H, P, 2, 0.6), { tone: "mid", inner: L(k.sideSeam(WALL, WALL_H - 6, P, 2), { tone: "faint" }) }));
  const bannerY = WALL.y + WALL.d;
  back.push(
    `<g transform="${planeOf(bannerY)}">` +
      `<path class="da-glass" d="${flat(-width * 0.34, WALL_H - 40, width * 0.34, WALL_H - 14, 2)}"/>` +
      `<path class="iso-line" data-tone="lo" d="${flat(-width * 0.34, WALL_H - 40, width * 0.34, WALL_H - 14, 2)}"/>` +
      `<text class="da-ink-gold" x="0" y="${-(WALL_H - 30)}" font-size="9" text-anchor="middle">RAKERNAS BMH 2026</text>` +
      `</g>`
  );
  // Panggung + tangga + podium
  back.push(S(k.slabOf(STAGE, 0, STAGE_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(STAGE, STAGE_H - 2.4, P, 4), { tone: "faint" }) }));
  back.push(L(k.planOutline(k.insetPlan(STAGE, 4), STAGE_H, P, 4), { tone: "faint" }));
  for (const [i, h] of [[0, 3], [1, 6]] as const) {
    const step: Plan = { x: aisleX - 14, y: STAGE.y + STAGE.d + (1 - i) * 5, w: 28, d: 5, r: 0.6 };
    back.push(S(k.slabOf(step, 0, h, P, 2), { tone: "mid" }));
  }
  const podium: Plan = { x: -12, y: STAGE.y + 14, w: 24, d: 14, r: 2 };
  back.push(S(k.slabOf(podium, STAGE_H, 26, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(podium, STAGE_H + 20, P, 3), { tone: "faint" }) }));
  back.push(S(k.slabOf({ x: -14, y: STAGE.y + 13, w: 28, d: 16, r: 2 }, STAGE_H + 26, 2, P, 3), { tone: "mid" }));
  back.push(S(k.cylinder(0, STAGE.y + 17, 0.8, STAGE_H + 28, 9, P, 10), { tone: "lo", crease: "none" }));
  back.push(S(k.cylinder(0, STAGE.y + 17, 2, STAGE_H + 37, 2.4, P, 16), { tone: "mid" }));
  // Pengeras suara di kedua sisi panggung
  for (const sx of [x0 + 6, x0 + width - 18]) {
    const box: Plan = { x: sx, y: STAGE.y + 6, w: 12, d: 10, r: 1.2 };
    back.push(S(k.slabOf(box, STAGE_H, 22, P, 2, 0.4), { tone: "mid" }));
    back.push(L(k.sideRing([sx + 6, box.y + box.d, STAGE_H + 15], 3.2, "y", P) + k.sideRing([sx + 6, box.y + box.d, STAGE_H + 6], 2, "y", P), { tone: "lo" }));
  }
  // Nomor baris di tepi kiri lantai
  back.push(D(Array.from({ length: rows }, (_, r) => at([x0 - 8, seatY(r) + SEAT_D / 2, 0])), { size: 0.7, tone: "mid" }));

  // Kursi, urut dari belakang ke depan agar urutan pelukis benar
  const order = layout.seats
    .map((seat, index) => ({ seat, index }))
    .sort((a, b) => k.depthOf([seatX(a.seat.col), seatY(a.seat.row), 0], P) - k.depthOf([seatX(b.seat.col), seatY(b.seat.row), 0], P));

  const seats: HallSeat[] = order.map(({ seat, index }) => {
    const x = seatX(seat.col);
    const y = seatY(seat.row);
    const legs: Plan = { x: x + 3, y: y + 2, w: SEAT_W - 6, d: SEAT_D - 5, r: 1 };
    const pad: Plan = { x, y, w: SEAT_W, d: SEAT_D, r: 1.6 };
    const backrest: Plan = { x, y: y + SEAT_D - 2.4, w: SEAT_W, d: 2.4, r: 0.8 };
    const cx = x + SEAT_W / 2;
    const cy = y + SEAT_D / 2 - 1;
    const empty = [
      S(k.slabOf(legs, 0, 6, P, 2), { tone: "lo" }),
      S(k.slabOf(pad, 6, 3, P, 3, 0.4), { tone: "mid" }),
      S(k.slabOf(backrest, 9, 9, P, 2, 0.4), { tone: "mid" }),
    ];
    // Sosok duduk: badan + kepala (digambar di antara alas & sandaran)
    const body = (lit: boolean) =>
      [
        S(k.cylinder(cx, cy, 4.4, 9, 15, P, 20, 0.4), { tone: "hi", crease: "lo", lit }),
        S(k.cylinder(cx, cy, 3.2, 24, 6.5, P, 20, 0.6), { tone: "hi", crease: "lo", lit }),
      ].join("");
    return {
      index,
      empty: empty.join(""),
      person: empty[0] + empty[1] + body(false) + empty[2],
      personLit: empty[0] + empty[1] + body(true) + empty[2],
      hit: at([cx, cy, 12]),
      hitR: Math.max(6, k.screenRise(12, P)),
      ring: k.ring(cx, cy + 1, 12, 0, P, 32),
    };
  });

  back.push(T.ruler({ x: FLOOR.x + 14, y: FLOOR.y + FLOOR.d - 10, w: Math.min(160, FLOOR.w - 80), d: 6, r: 1 }));
  return { P, back: back.join(""), seats, front: "" };
}
