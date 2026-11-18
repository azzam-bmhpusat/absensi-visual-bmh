"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plate } from "@/components/iso/draw";
import { spring, useLoop, useReadout, useStillness, type Spring } from "@/components/iso/live";
import type { SessionData } from "@/lib/display-helpers";
import { clockHands, fitText, hallReadout, knobAngle, sessionShortName, wibClockText } from "@/lib/display-anatomy-model";
import {
  ART_BACK,
  ART_KNOB,
  CLOCK,
  HEIGHT,
  KNOB_DEPTH,
  LAMP_DOME,
  LCD,
  NAME,
  PLANES,
  QR_PLATE,
  WIDTH,
  knobHub,
  knobPointer,
  studsFor,
} from "./geometry";

const KNOB_HUB = knobHub();

export interface ControlPanelProps {
  eventName: string;
  sessions: SessionData[];
  current: SessionData;
  onSelect: (session: SessionData) => void;
  status: "connected" | "reconnecting";
  hadir: number;
  total: number;
}

const dayOf = (s: SessionData) => s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3);
const sessionLabel = (s: SessionData) => `Hari ${dayOf(s)} · ${s.nama}`;

/** Fig 0 · Panel Kontrol — jam WIB, kenop pemilih sesi (klik paku / tombol ← →), LCD sesi, lampu status. */
export function ControlPanelFigure({ eventName, sessions, current, onSelect, status, hadir, total }: ControlPanelProps) {
  const { anchor, say } = useReadout<SVGSVGElement>();
  const still = useStillness();
  const index = Math.max(0, sessions.findIndex((s) => s.id === current.id));
  const angles = useMemo(() => sessions.map((_, i) => knobAngle(i, sessions.length)), [sessions]);
  const studs = useMemo(() => studsFor(angles), [angles]);
  const [now, setNow] = useState<Date | null>(null);
  const pointerRef = useRef<SVGPathElement>(null);
  const knob = useRef<Spring>({ at: angles[index] ?? 0, rate: 0 });
  const targetRef = useRef(angles[index] ?? 0);

  // Jam berdetak tiap detik (dimulai setelah hidrasi)
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const kick = useLoop((dt, calm) => {
    const settled = spring(knob.current, targetRef.current, dt, 70, 12, calm);
    pointerRef.current?.setAttribute("d", knobPointer(knob.current.at));
    return !settled;
  }, false);

  useEffect(() => {
    targetRef.current = angles[index] ?? 0;
    kick();
  }, [index, angles, kick, still]);

  const readout = `${sessionShortName(current.nama)} H${dayOf(current)} · ${hallReadout(hadir, total)}`;
  useEffect(() => say(readout), [readout, say]);

  const hands = now ? clockHands(now) : { hour: 0, minute: 0, second: 0 };
  const select = (i: number) => sessions[i] && onSelect(sessions[i]);
  const studArt = (i: number) => (i === index ? studs[i].on : studs[i].off);
  const behind = studs.map((s, i) => ({ s, i })).filter(({ s }) => s.depth < KNOB_DEPTH);
  const before = studs.map((s, i) => ({ s, i })).filter(({ s }) => s.depth >= KNOB_DEPTH);
  const live = status === "connected";

  return (
    <Plate fig="Fig 0" title="Panel Kontrol" hint="Klik paku kenop / ← → : ganti sesi" readout={readout}>
      <div className="iso-stage">
        <svg
          ref={anchor}
          className="iso-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="group"
          tabIndex={0}
          aria-label={`Panel kontrol: ${sessionLabel(current)}. Tombol panah kiri/kanan mengganti sesi.`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") select(Math.min(sessions.length - 1, index + 1));
            else if (e.key === "ArrowLeft") select(Math.max(0, index - 1));
          }}
        >
          <g dangerouslySetInnerHTML={{ __html: ART_BACK }} />

          {/* Plat nama acara */}
          <g transform={PLANES.name}>
            <text className="da-ink" x={NAME.x0 + 10} y={-(NAME.z1 - 20)} fontSize={11.5}>
              {fitText(eventName.toUpperCase(), 44)}
            </text>
            <text className="da-ink-dim" x={NAME.x0 + 10} y={-(NAME.z0 + 10)} fontSize={9}>
              VIDEOTRON KEHADIRAN REALTIME
            </text>
          </g>

          {/* Jam analog WIB */}
          <g transform={PLANES.clock}>
            <line className="da-hand" x1={CLOCK.cx} y1={-CLOCK.cz} x2={CLOCK.cx} y2={-(CLOCK.cz + CLOCK.r * 0.5)} transform={`rotate(${hands.hour} ${CLOCK.cx} ${-CLOCK.cz})`} />
            <line className="da-hand" x1={CLOCK.cx} y1={-CLOCK.cz} x2={CLOCK.cx} y2={-(CLOCK.cz + CLOCK.r * 0.78)} transform={`rotate(${hands.minute} ${CLOCK.cx} ${-CLOCK.cz})`} />
            <line className="da-hand-sec" x1={CLOCK.cx} y1={-(CLOCK.cz - 4)} x2={CLOCK.cx} y2={-(CLOCK.cz + CLOCK.r * 0.85)} transform={`rotate(${hands.second} ${CLOCK.cx} ${-CLOCK.cz})`} />
            <circle className="da-gold-fill" cx={CLOCK.cx} cy={-CLOCK.cz} r={1.3} />
          </g>

          {/* LCD sesi + jam digital + hitungan */}
          <g transform={PLANES.lcd}>
            <text className="da-ink" x={LCD.x0 + 10} y={-(LCD.z1 - 18)} fontSize={13}>
              {fitText(sessionLabel(current).toUpperCase(), 44)}
            </text>
            <text className="da-ink-gold" x={LCD.x0 + 10} y={-(LCD.z0 + 9)} fontSize={15}>
              {now ? `${wibClockText(now)} WIB` : "--:--:-- WIB"}
            </text>
            <text className="da-ink-dim" x={LCD.x1 - 10} y={-(LCD.z0 + 9)} fontSize={12} textAnchor="end">
              {`HADIR ${hadir}/${total}`}
            </text>
          </g>

          {/* Plat petunjuk scan QR */}
          <g transform={PLANES.qr}>
            <text className="da-ink-gold" x={(QR_PLATE.x0 + QR_PLATE.x1) / 2} y={-(QR_PLATE.z1 - 17)} fontSize={13} textAnchor="middle">
              SCAN QR
            </text>
            <text className="da-ink-dim" x={(QR_PLATE.x0 + QR_PLATE.x1) / 2} y={-(QR_PLATE.z0 + 10)} fontSize={8} textAnchor="middle">
              DI PINTU MASUK
            </text>
          </g>

          {/* Lampu status realtime */}
          <g dangerouslySetInnerHTML={{ __html: live ? LAMP_DOME.on : LAMP_DOME.off }} />
          <circle className={live ? "da-accent da-pulse" : "da-gold-fill"} cx={LAMP_DOME.glow[0]} cy={LAMP_DOME.glow[1]} r={1.6} />

          {/* Kenop pemilih sesi: paku di belakang → kenop → paku di depan → jarum */}
          {behind.map(({ i }) => (
            <g key={i} dangerouslySetInnerHTML={{ __html: studArt(i) }} />
          ))}
          <g dangerouslySetInnerHTML={{ __html: ART_KNOB }} />
          {before.map(({ i }) => (
            <g key={i} dangerouslySetInnerHTML={{ __html: studArt(i) }} />
          ))}
          <path ref={pointerRef} className="iso-line" data-tone="lit" d={knobPointer(angles[index] ?? 0)} />
          <g dangerouslySetInnerHTML={{ __html: KNOB_HUB }} />

          {/* Area klik paku */}
          {studs.map((s, i) => (
            <circle key={i} data-hit="" cx={s.hit[0]} cy={s.hit[1]} r={7} onClick={() => select(i)}>
              <title>{sessionLabel(sessions[i])}</title>
            </circle>
          ))}
        </svg>
      </div>
    </Plate>
  );
}
