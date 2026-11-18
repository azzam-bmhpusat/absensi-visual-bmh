"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plate } from "@/components/iso/draw";
import { useLoop, useReadout, useStillness } from "@/components/iso/live";
import { PUNCH_MS, clockHands, fitText, punchPose, stackHeight, wibClockText } from "@/lib/display-anatomy-model";
import { clockOf } from "@/lib/live-attendance-model";
import {
  ART_BASE,
  ART_MACHINE,
  ART_TRAY_R,
  CARD,
  CARD_ART,
  CLOCK,
  HEIGHT,
  LEVER_ART,
  LEVER_DOWN,
  LEVER_TRAVEL,
  PLANES,
  PRINT,
  WIDTH,
  stackArt,
} from "./geometry";

export interface PunchItem {
  id: string;
  nama: string;
  daerah: string;
  checkedInAt: string;
}

export interface TimeClockProps {
  queue: PunchItem[];
  onDone: (id: string) => void;
  hadir: number;
  belum: number;
  total: number;
}

const CX = (CARD.x0 + CARD.x1) / 2;

/** Fig 2 · Jam Absen Kartu — tiap tamu baru: kartu turun, dicap, lalu naik membawa jam masuk. */
export function TimeClockFigure({ queue, onDone, hadir, belum, total }: TimeClockProps) {
  const { anchor, say } = useReadout<SVGSVGElement>();
  const still = useStillness();
  const current = queue[0] ?? null;
  const [now, setNow] = useState<Date | null>(null);
  const [stamped, setStamped] = useState(false);
  const cardRef = useRef<SVGGElement>(null);
  const leverRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGRectElement>(null);
  const started = useRef(0);
  const stampedRef = useRef(false);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const apply = (t: number) => {
    const pose = punchPose(t);
    const up = CARD_ART.up;
    cardRef.current?.setAttribute("transform", `translate(${(up[0] * pose.card).toFixed(2)} ${(up[1] * pose.card).toFixed(2)})`);
    cardRef.current?.setAttribute("opacity", pose.opacity.toFixed(3));
    const drop = pose.lever * LEVER_TRAVEL;
    leverRef.current?.setAttribute("transform", `translate(${(LEVER_DOWN[0] * drop).toFixed(2)} ${(LEVER_DOWN[1] * drop).toFixed(2)})`);
    glowRef.current?.setAttribute("opacity", (0.15 + 0.85 * pose.glow).toFixed(3));
    return pose;
  };

  const kick = useLoop((_dt, calm) => {
    if (!current) return false;
    const t = calm ? 3500 : performance.now() - started.current;
    const pose = apply(t);
    if (pose.stamped !== stampedRef.current) {
      stampedRef.current = pose.stamped;
      setStamped(pose.stamped);
    }
    return !calm && t < PUNCH_MS;
  }, false);

  // Kartu baru di antrean → mulai siklus 5 detik, lalu lepas dari antrean (sama seperti banner /display)
  const currentId = current?.id;
  useEffect(() => {
    if (!currentId) return;
    started.current = performance.now();
    stampedRef.current = false;
    const reset = setTimeout(() => setStamped(still), 0);
    kick();
    const done = setTimeout(() => onDone(currentId), PUNCH_MS);
    return () => {
      clearTimeout(reset);
      clearTimeout(done);
    };
  }, [currentId, onDone, kick, still]);

  const readout = current ? `Selamat datang, ${fitText(current.nama, 20)}` : `${hadir} masuk · ${belum} belum`;
  useEffect(() => say(readout), [readout, say]);

  const hands = now ? clockHands(now) : { hour: 0, minute: 0, second: 0 };
  const stacks = useMemo(
    () => ({ left: stackArt("left", stackHeight(belum, total)), right: stackArt("right", stackHeight(hadir, total)) }),
    [belum, hadir, total]
  );

  return (
    <Plate fig="Fig 2" title="Jam Absen" readout={readout}>
      <div className="iso-stage">
        <svg ref={anchor} className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={current ? `Mesin absen mencap kartu ${current.nama}.` : "Mesin absen menunggu tamu berikutnya."}>
          <defs>
            <clipPath id="tc-card-clip">
              <path d={CARD_ART.clip} />
            </clipPath>
          </defs>
          <g dangerouslySetInnerHTML={{ __html: ART_BASE + stacks.left + ART_MACHINE }} />

          {/* Jam mesin (WIB) */}
          <g transform={PLANES.clock}>
            <line className="da-hand" x1={CLOCK.cx} y1={-CLOCK.cz} x2={CLOCK.cx} y2={-(CLOCK.cz + CLOCK.r * 0.5)} transform={`rotate(${hands.hour} ${CLOCK.cx} ${-CLOCK.cz})`} />
            <line className="da-hand" x1={CLOCK.cx} y1={-CLOCK.cz} x2={CLOCK.cx} y2={-(CLOCK.cz + CLOCK.r * 0.78)} transform={`rotate(${hands.minute} ${CLOCK.cx} ${-CLOCK.cz})`} />
            <line className="da-hand-sec" x1={CLOCK.cx} y1={-(CLOCK.cz - 4)} x2={CLOCK.cx} y2={-(CLOCK.cz + CLOCK.r * 0.85)} transform={`rotate(${hands.second} ${CLOCK.cx} ${-CLOCK.cz})`} />
            <circle className="da-gold-fill" cx={CLOCK.cx} cy={-CLOCK.cz} r={1.4} />
          </g>

          {/* Jendela cetak: menyala saat stempel */}
          <g transform={PLANES.print}>
            <rect ref={glowRef} className="da-accent" x={PRINT.x0} y={-PRINT.z1} width={PRINT.x1 - PRINT.x0} height={PRINT.z1 - PRINT.z0} opacity={0.15} />
            <text className="da-ink-gold" x={0} y={-(PRINT.z1 - 12)} fontSize={9} textAnchor="middle">
              {current ? `MASUK ${clockOf(current.checkedInAt)}` : now ? wibClockText(now) : "--:--:--"}
            </text>
            <text className="da-ink-dim" x={0} y={-(PRINT.z0 + 6)} fontSize={5.5} textAnchor="middle">
              {current ? "TERCATAT" : "MENUNGGU"}
            </text>
          </g>

          {/* Tuas stempel */}
          <g ref={leverRef} dangerouslySetInnerHTML={{ __html: LEVER_ART }} />

          {/* Kartu tamu baru */}
          {current ? (
            <g clipPath="url(#tc-card-clip)">
              <g ref={cardRef} opacity={0}>
                <g dangerouslySetInnerHTML={{ __html: CARD_ART.solid }} />
                <g transform={CARD_ART.plane}>
                  <text className="da-ink-dim" x={CX} y={-(CARD.z1 - 7)} fontSize={4.2} textAnchor="middle">
                    KARTU HADIR
                  </text>
                  <text className="da-ink" x={CX} y={-(CARD.z1 - 16)} fontSize={5.2} textAnchor="middle">
                    {fitText(current.nama, 15)}
                  </text>
                  <text className="da-ink-dim" x={CX} y={-(CARD.z1 - 23)} fontSize={4.2} textAnchor="middle">
                    {fitText(current.daerah, 18)}
                  </text>
                  {stamped ? (
                    <g>
                      <rect className="da-gold-line" x={CARD.x0 + 6} y={-(CARD.z1 - 27)} width={CARD.x1 - CARD.x0 - 12} height={9} rx={1} />
                      <text className="da-ink-gold" x={CX} y={-(CARD.z1 - 33.6)} fontSize={5.6} textAnchor="middle">
                        {`MASUK ${clockOf(current.checkedInAt)}`}
                      </text>
                    </g>
                  ) : null}
                </g>
              </g>
            </g>
          ) : null}

          <g dangerouslySetInnerHTML={{ __html: ART_TRAY_R + stacks.right }} />
        </svg>
      </div>
    </Plate>
  );
}
