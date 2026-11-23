"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as k from "@/components/iso/iso-kit";
import { useLoop, useStillness } from "@/components/iso/live";
import { buildWorld, type World } from "@/components/figures/display-absen/world";
import { clockHands, fitText, wibClockText } from "@/lib/display-anatomy-model";
import { formatGuestAffiliation } from "@/lib/display-helpers";
import type { DisplayAnatomyData } from "@/lib/display-anatomy-data";
import { clockOf } from "@/lib/live-attendance-model";
import {
  WALK_SPEED,
  buildSeats,
  capacityFor,
  firstWords,
  lookOf,
  nextTour,
  planHall,
  pointOnRoute,
  routeLength,
  seatPos,
  slotOfY,
  walkRoute,
  zDeckOf,
  PITCH_Y,
  RISE,
  type Look,
  type SeatEntry,
  type V3,
} from "@/lib/display-absen-model";
import { useDisplayRealtime } from "@/components/display-anatomy/use-display-realtime";
import { useAspect } from "./use-aspect";
import { useDemoLive } from "./demo";
import type { LiveData } from "./live-data";
import "./scene.css";

const SVG_NS = "http://www.w3.org/2000/svg";
const HOLD_MS = 5200;
const TOUR_MS = 4400;
const MAX_WALKERS = 4;

type Props = DisplayAnatomyData & { demo?: boolean };

/** Titik masuk: pilih sumber data langsung (database realtime atau mode gladi). */
export function AbsenScene({ demo, ...data }: Props) {
  return demo ? <DemoHost {...data} /> : <RealHost {...data} />;
}

function RealHost({ eventName, activeSession, guests, attendances }: DisplayAnatomyData) {
  const live = useDisplayRealtime({
    initialSession: activeSession,
    initialGuests: guests,
    initialAttendances: attendances,
    basePath: "/display-absen",
    channelName: "attendances-display-absen",
  });
  return <Hall eventName={eventName} live={live} />;
}

function DemoHost({ eventName, activeSession }: DisplayAnatomyData) {
  const live = useDemoLive(activeSession);
  return <Hall eventName={eventName} live={live} />;
}

/** Bulatkan: sin/cos bisa beda di digit terakhir antara server & browser (hydration). */
const n2 = (v: number) => Math.round(v * 100) / 100;

const lookStyle = (l: Look): CSSProperties =>
  ({
    "--sk": l.skin,
    "--cl": l.cloth,
    "--hr": l.hair,
    "--ac": l.accent,
    "--ph": `${l.delay}s`,
    "--fc": `${l.face}s`,
    ...(l.turner ? { "--tf": "ab-hdf", "--tb": "ab-hdb" } : null),
  }) as CSSProperties;

// ---------------------------------------------------------------- Kursi
interface SeatViewProps {
  off: [number, number];
  tagPlane: string;
  entry: SeatEntry | null;
  present: boolean;
  fresh: boolean;
}

const SeatView = memo(function SeatView({ off, tagPlane, entry, present, fresh }: SeatViewProps) {
  const look = entry ? lookOf(entry.key) : null;
  return (
    <g transform={`translate(${off[0].toFixed(1)} ${off[1].toFixed(1)})`}>
      <use href="#ab-chair-b" />
      {present && look ? <use href={`#ab-ps${look.head}`} className={fresh ? "ab-sit" : undefined} style={lookStyle(look)} /> : null}
      <use href="#ab-chair-k" />
      {present && entry ? (
        <g transform={tagPlane}>
          {/* plat selebar sandaran; 8 karakter monospace 2.6 ≈ 12.9 unit, muat di plat 14.4 */}
          <rect className="ab-tag" x={-7.2} y={-13.7} width={14.4} height={4.4} rx={0.8} />
          <text className="da-ink ab-tag-t" x={0} y={-10.6} fontSize={2.6} textAnchor="middle">
            {firstWords(entry.nama, 8)}
          </text>
        </g>
      ) : null}
    </g>
  );
});

// ---------------------------------------------------------------- Layar LED
interface LedProps {
  world: World;
  eventName: string;
  sessionName: string;
  hadir: number;
  total: number;
  pct: number;
  welcome: SeatEntry | null;
  ticker: Array<{ id: string; nama: string; time: string }>;
}

function Led({ world, eventName, sessionName, hadir, total, pct, welcome, ticker }: LedProps) {
  const { x0, x1, z0, z1 } = world.led;
  const w = x1 - x0;
  const fit = (text: string, size: number, width = w - 16) => fitText(text, Math.max(6, Math.floor(width / (size * 0.62))));
  const Y = (z: number) => -(z1 - z);
  const track = w - 16;
  return (
    <g transform={world.led.plane}>
      <text className="da-ink-gold ab-led-head" x={0} y={Y(8)} fontSize={5.2} textAnchor="middle">
        {fit(eventName.toUpperCase(), 5.2, w - 24)}
      </text>
      <text className="da-ink-dim" x={0} y={Y(14.4)} fontSize={3.9} textAnchor="middle">
        {fit(sessionName.toUpperCase(), 3.9, w - 24)}
      </text>
      <rect className="ab-led-rule" x={-w * 0.18} y={Y(17.6)} width={w * 0.36} height={0.5} />
      {welcome ? (
        <g key={welcome.key} className="ab-fadein">
          <text className="da-ink-dim" x={0} y={Y(25)} fontSize={4.4} textAnchor="middle" letterSpacing={1.2}>
            SELAMAT DATANG
          </text>
          <text className="da-ink" x={0} y={Y(39)} fontSize={13} textAnchor="middle">
            {fit(welcome.nama, 13, w - 24)}
          </text>
          <text className="da-ink-dim" x={0} y={Y(47.6)} fontSize={5.4} textAnchor="middle">
            {fit(
              formatGuestAffiliation({ perwakilan_daerah: welcome.daerah, jabatan: welcome.jabatan, departemen: welcome.departemen, kategori: welcome.kategori }),
              5.4,
              w - 24
            )}
          </text>
          <text className="da-ink-gold" x={0} y={Y(56.4)} fontSize={6} textAnchor="middle">
            {welcome.checkedInAt ? `MASUK ${clockOf(welcome.checkedInAt)} WIB` : "MASUK"}
          </text>
        </g>
      ) : (
        <g className="ab-fadein">
          <text className="da-ink" x={x0 + 10} y={Y(45)} fontSize={31}>
            {hadir}
          </text>
          <text className="da-ink-dim" x={x0 + 10} y={Y(54)} fontSize={5.4}>
            {`HADIR · DARI ${total}`}
          </text>
          {ticker.map((t, i) => (
            <g key={t.id}>
              <text className="da-ink-gold" x={x0 + w * 0.46} y={Y(25 + i * 9.4)} fontSize={5.2}>
                {t.time}
              </text>
              <text className="da-ink" x={x0 + w * 0.46 + 17} y={Y(25 + i * 9.4)} fontSize={5.2}>
                {fit(t.nama, 5.2, w * 0.54 - 28)}
              </text>
            </g>
          ))}
        </g>
      )}
      <rect className="ab-track" x={x0 + 8} y={-(z0 + 5.2)} width={track - 18} height={2.2} rx={1.1} />
      <rect className="ab-fill" x={x0 + 8} y={-(z0 + 5.2)} width={Math.max(0, Math.min(1, pct / 100)) * (track - 18)} height={2.2} rx={1.1} />
      <text className="da-ink-dim" x={x1 - 8} y={-(z0 + 3.2)} fontSize={3.6} textAnchor="end">
        {`${pct}%`}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------- Jam & indikator
function ClockFace({ world }: { world: World }) {
  const { cx, cz, r, plane } = world.clock;
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  const h = now ? clockHands(now) : { hour: 0, minute: 0, second: 0 };
  const y = -cz;
  return (
    <g transform={plane}>
      <line className="da-hand" x1={cx} y1={y} x2={cx} y2={y - r * 0.5} transform={`rotate(${h.hour} ${cx} ${y})`} />
      <line className="da-hand" x1={cx} y1={y} x2={cx} y2={y - r * 0.78} transform={`rotate(${h.minute} ${cx} ${y})`} />
      <line className="da-hand-sec" x1={cx} y1={y + 4} x2={cx} y2={y - r * 0.86} transform={`rotate(${h.second} ${cx} ${y})`} />
      <circle className="da-gold-fill" cx={cx} cy={y} r={1.4} />
      <text className="da-ink-gold" x={cx} y={y + r * 0.58} fontSize={4.6} textAnchor="middle">
        {now ? wibClockText(now) : "--:--:--"}
      </text>
    </g>
  );
}

function Gauge({ world, pct, status }: { world: World; pct: number; status: "connected" | "reconnecting" }) {
  const { cx, cz, r, plane } = world.gauge;
  const N = 40;
  const lit = Math.round((Math.max(0, Math.min(100, pct)) / 100) * N);
  const y = -cz;
  return (
    <g transform={plane}>
      {Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2;
        const r1 = r - 2;
        const r0 = r - 6.4;
        return (
          <line
            key={i}
            className={i < lit ? "ab-tick on" : "ab-tick"}
            x1={n2(cx + Math.sin(a) * r0)}
            y1={n2(y - Math.cos(a) * r0)}
            x2={n2(cx + Math.sin(a) * r1)}
            y2={n2(y - Math.cos(a) * r1)}
          />
        );
      })}
      <text className="da-ink" x={cx} y={y + 3.4} fontSize={11} textAnchor="middle">
        {pct}
      </text>
      <text className="da-ink-dim" x={cx} y={y + 9.6} fontSize={3.6} textAnchor="middle">
        % HADIR
      </text>
      <circle className={status === "connected" ? "ab-lamp" : "ab-lamp warn"} cx={cx} cy={y - r * 0.38} r={1.7} />
    </g>
  );
}

// ---------------------------------------------------------------- Kartu data (sorot)
function Callout({ world, entry, index }: { world: World; entry: SeatEntry; index: number }) {
  const s = seatPos(world.plan, index);
  const anchor = world.at([s.x, s.y, s.z + 31]);
  const width = 250;
  const height = 92;
  const SAFE = 24; // jarak aman dari tepi layar
  const x = Math.min(world.W - width - SAFE, Math.max(SAFE, anchor[0] - width / 2));
  const y = Math.max(SAFE, anchor[1] - height - 34);
  const aff = formatGuestAffiliation({ perwakilan_daerah: entry.daerah, jabatan: entry.jabatan, departemen: entry.departemen, kategori: entry.kategori });
  // batas karakter dari lebar kartu (font monospace ≈ 0.62em per karakter) agar teks tidak keluar bingkai
  const maxChars = (size: number) => Math.max(6, Math.floor((width - 28) / (size * 0.62)));
  const clipId = `ab-card-clip-${index}`;
  return (
    <g className="ab-card" key={entry.key}>
      <path className="ab-stem" d={`M${anchor[0].toFixed(1)} ${anchor[1].toFixed(1)}L${anchor[0].toFixed(1)} ${(y + height).toFixed(1)}`} />
      <circle className="ab-stem-dot" cx={anchor[0]} cy={anchor[1]} r={3} />
      <rect className="ab-card-bg" x={x} y={y} width={width} height={height} rx={9} />
      <clipPath id={clipId}>
        <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} rx={8} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <text className="da-ink" x={x + 14} y={y + 30} fontSize={23}>
          {fitText(entry.nama, maxChars(23))}
        </text>
        <text className="da-ink-dim" x={x + 14} y={y + 54} fontSize={15}>
          {fitText(aff, maxChars(15))}
        </text>
        <text className="da-ink-gold" x={x + 14} y={y + 78} fontSize={16}>
          {fitText(entry.checkedInAt ? `MASUK ${clockOf(entry.checkedInAt)} WIB` : "TERDAFTAR", maxChars(16))}
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- Aula
interface Walker {
  id: string;
  index: number;
  route: V3[];
  length: number;
  dist: number;
  el: SVGGElement;
  use: SVGUseElement;
  slot: number;
  kind: number;
  last: string;
  persistent?: boolean;
  dir?: 1 | -1;
  finish?: () => void;
}

interface Sim {
  t: number;
  focus: { x: number; y: number; z: number } | null;
  lampAim: Array<{ x: number; y: number }>;
}
interface Meters {
  segs: SVGRectElement[][];
  level: number[];
  acc: number;
}
interface StepCtx {
  w: World;
  slots: Array<SVGGElement | null>;
  beams: Array<{ path: SVGPathElement | null; pool: SVGPathElement | null }>;
  walkers: Map<string, Walker>;
  ushers: Walker[];
  meters: Meters | null;
  sim: Sim;
}

const STEP_FRAMES = [0, 1, 2, 1];

function poseWalker(w: World, u: Walker, p: { x: number; y: number; z: number }, dist: number, stride: number, bob = 0) {
  const [dx, dy] = w.off(p.x, p.y, p.z + bob);
  u.el.setAttribute("transform", `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`);
  const href = `#ab-pw${u.kind}${STEP_FRAMES[Math.floor(Math.abs(dist) / stride) % 4]}`;
  if (href !== u.last) {
    u.use.setAttribute("href", href);
    u.last = href;
  }
}

/** Satu langkah simulasi: pejalan, petugas, meteran mixer, sorot lampu (hanya menulis atribut DOM). */
function stepScene(c: StepCtx, dt: number, calm: boolean) {
  const { w, sim } = c;
  sim.t += dt;
  const t = sim.t;

  // tamu yang sedang berjalan ke kursinya
  let lead: Walker | null = null;
  for (const [id, walker] of c.walkers) {
    walker.dist += WALK_SPEED * dt * (calm ? 50 : 1);
    const p = pointOnRoute(walker.route, walker.dist);
    const slot = slotOfY(p.y, w.plan.rows);
    if (walker.slot !== slot) {
      c.slots[slot]?.appendChild(walker.el);
      walker.slot = slot;
    }
    poseWalker(w, walker, p, walker.dist, 5.2, Math.abs(Math.sin(walker.dist * 0.34)) * 1.1);
    lead = walker;
    if (p.done) {
      c.walkers.delete(id);
      walker.finish?.();
      setTimeout(() => walker.el.remove(), 180);
    }
  }
  if (lead) {
    const p = pointOnRoute(lead.route, lead.dist);
    sim.focus = { x: p.x, y: p.y, z: p.z };
  } else sim.focus = null;

  // petugas penyambut: mondar-mandir di teras
  for (const u of c.ushers) {
    u.dist += (calm ? 0 : WALK_SPEED * 0.55 * dt) * (u.dir ?? 1);
    if (u.dist > u.length) u.dir = -1;
    if (u.dist < 0) u.dir = 1;
    poseWalker(w, u, pointOnRoute(u.route, Math.max(0, Math.min(u.length, u.dist))), u.dist, 5.6);
  }

  // meteran VU di meja mixer
  const m = c.meters;
  if (m) {
    m.acc += dt;
    if (m.acc > 0.11) {
      m.acc = 0;
      m.segs.forEach((col, ci) => {
        const target = 2 + Math.abs(Math.sin(t * (1.3 + ci * 0.37) + ci)) * 4.6 + Math.random() * 1.2;
        m.level[ci] += (target - m.level[ci]) * 0.5;
        col.forEach((seg, r) => {
          const on = r < m.level[ci];
          seg.classList.toggle("on", on);
          seg.classList.toggle("hot", on && r >= 5);
        });
      });
    }
  }

  // lampu sorot: menyapu penonton, atau mengunci ke tamu yang sedang berjalan
  const focus = sim.focus;
  const lamps = w.lamps;
  const aud = w.plan.blockW;
  const depth = w.plan.rows * PITCH_Y;
  const order = focus ? lamps.map((_, i) => i).sort((a, b) => Math.abs(lamps[a].at[0] - focus.x) - Math.abs(lamps[b].at[0] - focus.x)) : [];
  lamps.forEach((lamp, i) => {
    const aim = (sim.lampAim[i] ??= { x: lamp.at[0], y: depth * 0.4 });
    let tx = Math.sin(t * 0.33 + i * 1.7) * aud * 0.42;
    let ty = depth * (0.5 + 0.42 * Math.sin(t * 0.21 + i * 2.3));
    if (focus && order.slice(0, 2).includes(i)) {
      tx = focus.x;
      ty = focus.y;
    }
    const f = calm ? 1 : 1 - Math.exp(-dt / 0.55);
    aim.x += (tx - aim.x) * f;
    aim.y += (ty - aim.y) * f;
    const refs = c.beams[i];
    if (!refs?.path || !refs.pool) return;
    const z = zAt(aim.y, w);
    const pts = Array.from({ length: 22 }, (_, j) => k.iso([aim.x + 9 * Math.cos((j / 22) * Math.PI * 2), aim.y + 9 * Math.sin((j / 22) * Math.PI * 2), z], w.P));
    const left = pts.reduce((a, b) => (b[0] < a[0] ? b : a));
    const right = pts.reduce((a, b) => (b[0] > a[0] ? b : a));
    const [lx, ly] = lamp.screen;
    refs.path.setAttribute("d", `M${(lx - 2.5).toFixed(1)} ${ly.toFixed(1)}L${left[0].toFixed(1)} ${left[1].toFixed(1)}L${right[0].toFixed(1)} ${right[1].toFixed(1)}L${(lx + 2.5).toFixed(1)} ${ly.toFixed(1)}Z`);
    refs.pool.setAttribute("d", k.ring(aim.x, aim.y, 9, z, w.P, 22));
  });
}

function Hall({ eventName, live }: { eventName: string; live: LiveData }) {
  const aspect = useAspect();
  const still = useStillness();
  const seats = useMemo(() => buildSeats(live.guests, live.hadir), [live.guests, live.hadir]);
  const plan = useMemo(() => planHall(capacityFor(seats.length), aspect), [seats.length, aspect]);
  const world = useMemo(() => buildWorld(plan), [plan]);

  // ---- status interaktif (semua otomatis, bukan dari mouse)
  const [landed, setLanded] = useState<ReadonlySet<string>>(() => new Set());
  const [ledId, setLedId] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [tourKey, setTourKey] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const slotRefs = useRef<Array<SVGGElement | null>>([]);
  const beamRefs = useRef<Array<{ path: SVGPathElement | null; pool: SVGPathElement | null }>>([]);
  const walkers = useRef(new Map<string, Walker>());
  const ushers = useRef<Walker[]>([]);
  const seatsRef = useRef(seats);
  const worldRef = useRef(world);
  const stillRef = useRef(still);
  const welcomeRef = useRef(live.welcome);
  const dismissRef = useRef(live.dismissWelcome);
  const sim = useRef<Sim>({ t: 0, focus: null, lampAim: [] });
  const meters = useRef<Meters | null>(null);
  const lastTour = useRef(-1);

  useEffect(() => {
    seatsRef.current = seats;
    worldRef.current = world;
    stillRef.current = still;
    welcomeRef.current = live.welcome;
    dismissRef.current = live.dismissWelcome;
  });

  const entryByAttendance = useMemo(() => {
    const m = new Map<string, number>();
    seats.forEach((s, i) => s.attendanceId && m.set(s.attendanceId, i));
    return m;
  }, [seats]);
  const entryByAttendanceRef = useRef(entryByAttendance);
  useEffect(() => {
    entryByAttendanceRef.current = entryByAttendance;
  });

  // absensi baru yang masih berjalan/duduk: kursinya belum terisi
  const pending = useMemo(() => new Set(live.welcome.map((w) => w.id).filter((id) => !landed.has(id))), [live.welcome, landed]);
  const freshIds = useMemo(() => new Set(live.welcome.map((w) => w.id)), [live.welcome]);

  // ---- jalur jalan: mulai pejalan untuk tiap absensi baru
  const started = useRef(new Set<string>());
  const startWalker = useCallback((id: string) => {
    const w = worldRef.current;
    const index = entryByAttendanceRef.current.get(id);
    const key = index !== undefined ? (seatsRef.current[index]?.key ?? null) : null;
    const land = () => {
      setLanded((prev) => new Set(prev).add(id));
      setLedId(id);
      setFocusKey(key);
      setTimeout(() => {
        dismissRef.current(id);
        setLedId((cur) => (cur === id ? null : cur));
        setFocusKey((cur) => (cur === key ? null : cur));
      }, HOLD_MS);
    };
    if (index === undefined) {
      setTimeout(() => dismissRef.current(id), 0);
      return;
    }
    if (walkers.current.size >= MAX_WALKERS || stillRef.current) {
      setTimeout(land, 0);
      return;
    }
    const route = walkRoute(w.plan, index);
    const look = lookOf(seatsRef.current[index].key);
    const el = document.createElementNS(SVG_NS, "g") as SVGGElement;
    const use = document.createElementNS(SVG_NS, "use") as SVGUseElement;
    use.setAttribute("style", `--sk:${look.skin};--cl:${look.cloth};--hr:${look.hair};--ac:${look.accent}`);
    use.setAttribute("href", `#ab-pw${look.head}1`);
    el.appendChild(use);
    walkers.current.set(id, { id, index, route, length: routeLength(route), dist: 0, el, use, slot: -1, kind: look.head, last: "", finish: land });
    setLedId(id);
  }, []);

  useEffect(() => {
    for (const item of live.welcome) {
      if (started.current.has(item.id)) continue;
      started.current.add(item.id);
      startWalker(item.id);
    }
  }, [live.welcome, startWalker]);

  // ---- tur sorot: sorot satu penonton yang sudah hadir bergantian saat tidak ada kejadian baru
  useEffect(() => {
    const id = setInterval(() => {
      const filled = seatsRef.current.map((s, i) => (s.attendanceId ? i : -1)).filter((i) => i >= 0);
      const next = nextTour(filled, lastTour.current);
      if (next === null) return setTourKey(null);
      lastTour.current = next;
      setTourKey(seatsRef.current[next].key);
    }, TOUR_MS);
    return () => clearInterval(id);
  }, []);

  // ---- loop animasi (atribut ref, tanpa render per frame)
  const tick = useCallback((dt: number, calm: boolean) => {
    if (!svgRef.current) return true;
    stepScene(
      { w: worldRef.current, slots: slotRefs.current, beams: beamRefs.current, walkers: walkers.current, ushers: ushers.current, meters: meters.current, sim: sim.current },
      dt,
      calm
    );
    return true;
  }, []);
  useLoop(tick, true);

  // ---- pasang pejalan penyambut & meteran setelah dunia siap
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const groups: SVGGElement[] = [];
    const list: Walker[] = [];
    const rows = world.plan.rows;
    const deck = slotRefs.current[rows];
    const zTop = zDeckOf(rows);
    const half = world.plan.blockW / 2 + 4;
    const y0 = rows * PITCH_Y + 30;
    const defs: Array<[number, number, number]> = [
      [0, -half + 20, 0],
      [1, half - 20, 0],
    ];
    defs.forEach(([kind, xs], i) => {
      const route: V3[] = [
        [xs, y0 + (i ? 4 : -3), zTop],
        [-xs, y0 + (i ? 4 : -3), zTop],
      ];
      const el = document.createElementNS(SVG_NS, "g") as SVGGElement;
      const use = document.createElementNS(SVG_NS, "use") as SVGUseElement;
      const look = lookOf(`usher-${i}`);
      use.setAttribute("style", `--sk:${look.skin};--cl:${i ? "#c9a24a" : "#d9f1e7"};--hr:${look.hair};--ac:${look.accent}`);
      use.setAttribute("href", `#ab-pw${kind}1`);
      el.appendChild(use);
      deck?.appendChild(el);
      groups.push(el);
      list.push({ id: `usher-${i}`, index: -1, route, length: routeLength(route), dist: i ? routeLength(route) * 0.6 : routeLength(route) * 0.2, el, use, slot: rows, kind, last: "", persistent: true, dir: i ? -1 : 1 });
    });
    ushers.current = list;

    const segs: SVGRectElement[][] = [];
    svg.querySelectorAll<SVGRectElement>(".ab-seg").forEach((seg) => {
      const c = Number(seg.dataset.c);
      const r = Number(seg.dataset.r);
      (segs[c] ??= [])[r] = seg;
    });
    meters.current = { segs: segs.filter(Boolean), level: segs.map(() => 3), acc: 0 };
    return () => {
      groups.forEach((g) => g.remove());
      ushers.current = [];
      meters.current = null;
    };
  }, [world]);

  // ---- data turunan untuk LED & kartu
  const ledEntry = ledId ? (seats[entryByAttendance.get(ledId) ?? -1] ?? null) : null;
  const ticker = useMemo(() => live.hadir.slice(0, 4).map((a) => ({ id: a.id, nama: a.nama, time: clockOf(a.checked_in_at) })), [live.hadir]);
  const focusIndex = useMemo(() => {
    const key = focusKey ?? tourKey;
    if (!key) return -1;
    return seats.findIndex((s) => s.key === key && s.attendanceId && !pending.has(s.attendanceId));
  }, [seats, focusKey, tourKey, pending]);

  return (
    <svg ref={svgRef} className="iso-svg ab-svg" viewBox={`0 0 ${world.W} ${world.H}`} role="img" aria-label={`Aula kehadiran: ${live.hadirCount} dari ${live.totalGuests} tamu hadir`}>
      <defs dangerouslySetInnerHTML={{ __html: world.defs }} />
      <g dangerouslySetInnerHTML={{ __html: world.back1 }} />
      <Led
        world={world}
        eventName={eventName}
        sessionName={live.session.nama}
        hadir={live.hadirCount}
        total={live.totalGuests}
        pct={live.percentage}
        welcome={ledEntry}
        ticker={ticker}
      />
      <ClockFace world={world} />
      <Gauge world={world} pct={live.percentage} status={live.status} />
      <g dangerouslySetInnerHTML={{ __html: world.back2 }} />
      {Array.from({ length: world.plan.rows }, (_, r) => (
        <g key={r}>
          <g dangerouslySetInnerHTML={{ __html: world.rowBase[r] }} />
          <g ref={(el) => void (slotRefs.current[r] = el)} />
          <g className="ab-row" style={{ "--r": r } as CSSProperties}>
          {Array.from({ length: world.plan.cols }, (_, c) => {
            const i = r * world.plan.cols + c;
            const entry = seats[i] ?? null;
            const present = Boolean(entry?.attendanceId) && !pending.has(entry?.attendanceId ?? "");
            return (
              <SeatView
                key={i}
                off={world.seatOff[i]}
                tagPlane={world.tagPlane}
                entry={entry}
                present={present}
                fresh={Boolean(entry?.attendanceId && freshIds.has(entry.attendanceId))}
              />
            );
          })}
          </g>
        </g>
      ))}
      <g dangerouslySetInnerHTML={{ __html: world.deck }} />
      <g ref={(el) => void (slotRefs.current[world.plan.rows] = el)} />
      <g className="ab-beams">
        {world.lamps.map((_, i) => (
          <g key={i}>
            <path ref={(el) => void ((beamRefs.current[i] ??= { path: null, pool: null }).path = el)} className="ab-beam" />
            <path ref={(el) => void ((beamRefs.current[i] ??= { path: null, pool: null }).pool = el)} className="ab-pool" />
          </g>
        ))}
      </g>
      {/* teks layar digambar ulang di atas sorot lampu agar tetap terbaca */}
      <g className="ab-over" aria-hidden="true">
        <Led
          world={world}
          eventName={eventName}
          sessionName={live.session.nama}
          hadir={live.hadirCount}
          total={live.totalGuests}
          pct={live.percentage}
          welcome={ledEntry}
          ticker={ticker}
        />
        <ClockFace world={world} />
        <Gauge world={world} pct={live.percentage} status={live.status} />
      </g>
      {focusIndex >= 0 ? <Callout world={world} entry={seats[focusIndex]} index={focusIndex} /> : null}
    </svg>
  );
}

/** Tinggi lantai tribun pada kedalaman y (halus di antara baris). */
function zAt(y: number, w: World): number {
  const row = Math.min(w.plan.rows - 1, Math.max(0, Math.floor(y / PITCH_Y)));
  return (row + 1) * RISE;
}
