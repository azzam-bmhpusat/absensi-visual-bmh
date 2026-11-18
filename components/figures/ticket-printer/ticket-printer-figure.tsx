"use client";

import { useEffect, useRef } from "react";
import { Plate } from "@/components/iso/draw";
import { follow, spring, useLoop, useReadout, useStillness, type Spring } from "@/components/iso/live";
import { clockOf, fitText, ticketReadout, type LiveSnapshot } from "@/lib/live-attendance-model";
import {
  ART_BACK,
  ART_MID,
  ART_TRAY_BACK,
  ART_TRAY_FRONT,
  HEIGHT,
  LED_AT,
  TICKET,
  TICKET_ART,
  TRAY_SLOTS,
  WIDTH,
} from "./geometry";
import "./ticket-printer.css";

const RISE = TICKET.z1 - TICKET.z0;
const CX = (TICKET.x0 + TICKET.x1) / 2;
const LED_SECONDS = 1.6;

export interface TicketPrinterProps extends LiveSnapshot {
  pulse: number;
}

export function TicketPrinterFigure({ sessions, latest, pulse }: TicketPrinterProps) {
  const hasOpen = sessions.length > 0;
  const { anchor, say } = useReadout<SVGSVGElement>();
  const still = useStillness();
  const ticket = useRef<SVGGElement>(null);
  const led = useRef<SVGCircleElement>(null);
  const motion = useRef<{ out: Spring; led: number }>({ out: { at: 1, rate: 0 }, led: 0 });

  useEffect(() => {
    say(ticketReadout(latest, hasOpen));
  }, [latest, hasOpen, say]);

  const kick = useLoop((dt, calm) => {
    const m = motion.current;
    const settled = spring(m.out, 1, dt, 38, 11, calm);
    m.led = follow(m.led, 0, dt, LED_SECONDS / 3, calm);
    const drop = (1 - m.out.at) * RISE;
    ticket.current?.setAttribute(
      "transform",
      `translate(${(-TICKET_ART.rise[0] * drop).toFixed(2)} ${(-TICKET_ART.rise[1] * drop).toFixed(2)})`
    );
    led.current?.setAttribute("opacity", Math.min(1, m.led).toFixed(3));
    return !(settled && m.led === 0);
  }, false);

  // Absen baru: tiket keluar dari celah, LED menyala
  useEffect(() => {
    if (pulse === 0 || still) return;
    motion.current.out = { at: 0, rate: 0 };
    motion.current.led = 1;
    kick();
  }, [pulse, still, kick]);

  const current = latest[0];
  // Nomor urut = jumlah hadir di sesi tiket ini (tiket terbaru = urutan terakhir)
  const queue = String(sessions.find((s) => s.id === current?.sessionId)?.hadir ?? 0).padStart(4, "0");

  return (
    <Plate
      fig="Fig 2"
      title="Tiket Kedatangan"
      readout={ticketReadout(latest, hasOpen)}
      caption={
        !hasOpen
          ? "Belum ada sesi yang dibuka panitia; printer menunggu."
          : current
            ? `Hanya mencetak absen dari sesi yang dibuka. Tiket teratas adalah peserta terakhir; ${Math.min(4, latest.length - 1)} tiket sebelumnya di nampan.`
            : "Tiket pertama tercetak saat peserta pertama absen di sesi yang dibuka."
      }
    >
      <div className="iso-stage tp">
        <svg
          ref={anchor}
          className="iso-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={
            current
              ? `Printer tiket mencetak kedatangan terbaru: ${current.nama} dari ${current.daerah} pukul ${clockOf(current.checkedInAt)}.`
              : "Printer tiket menunggu kedatangan pertama."
          }
        >
          <defs dangerouslySetInnerHTML={{ __html: TICKET_ART.clip }} />
          <g dangerouslySetInnerHTML={{ __html: ART_BACK }} />

          {/* LED status menyala saat mencetak */}
          <circle ref={led} className="tp-led" cx={LED_AT[0]} cy={LED_AT[1]} r={1.9} opacity={0} />

          {/* Tiket terbaru, naik dari celah kertas */}
          <g clipPath={`url(#${TICKET_ART.clipId})`}>
            <g ref={ticket}>
              {current ? (
                <>
                  <g dangerouslySetInnerHTML={{ __html: TICKET_ART.solid }} />
                  <g transform={TICKET_ART.plane} className="tp-face">
                    <text className="tp-ink-dim" x={CX} y={-(TICKET.z1 - 7)} fontSize={3.2} textAnchor="middle">
                      RAKERNAS BMH 2026
                    </text>
                    <path className="tp-rule" d={`M${TICKET.x0 + 4} ${-(TICKET.z1 - 10)}H${TICKET.x1 - 4}`} />
                    <text className="tp-ink-dim" x={TICKET.x0 + 4} y={-(TICKET.z1 - 16)} fontSize={2.8}>
                      {`NO. ${queue}`}
                    </text>
                    <text className="tp-ink-dim" x={TICKET.x1 - 4} y={-(TICKET.z1 - 16)} fontSize={2.8} textAnchor="end">
                      HADIR
                    </text>
                    <text className="tp-ink" x={CX} y={-(TICKET.z1 - 28)} fontSize={5} textAnchor="middle">
                      {fitText(current.nama, 21)}
                    </text>
                    <text className="tp-ink-dim" x={CX} y={-(TICKET.z1 - 35)} fontSize={3.6} textAnchor="middle">
                      {fitText(current.daerah, 28)}
                    </text>
                    <text className="tp-ink-strong" x={CX} y={-(TICKET.z1 - 52)} fontSize={11} textAnchor="middle">
                      {clockOf(current.checkedInAt)}
                    </text>
                    <text className="tp-ink-dim" x={CX} y={-(TICKET.z1 - 59)} fontSize={2.8} textAnchor="middle">
                      {fitText(current.sessionLabel, 32)}
                    </text>
                    <path className="tp-rule" d={`M${TICKET.x0 + 4} ${-(TICKET.z1 - 63)}H${TICKET.x1 - 4}`} />
                    <path className="tp-barcode" d={barcode(TICKET.x0 + 10, TICKET.x1 - 10, -(TICKET.z1 - 65), 6, current.id)} />
                  </g>
                </>
              ) : null}
            </g>
          </g>

          <g dangerouslySetInnerHTML={{ __html: ART_MID }} />
          <g dangerouslySetInnerHTML={{ __html: ART_TRAY_BACK }} />

          {/* Tiket sebelumnya di nampan */}
          {TRAY_SLOTS.map((slot) => {
            const item = latest[slot.index];
            if (!item) return null;
            return (
              <g key={slot.index} className="tp-tray-ticket">
                <g dangerouslySetInnerHTML={{ __html: slot.solid + slot.rule }} />
                <text className="iso-face-text" data-tone="hi" transform={slot.name} fontSize={4}>
                  {fitText(item.nama, 22)}
                </text>
                <text className="iso-face-text" transform={slot.daerah} fontSize={3}>
                  {fitText(item.daerah, 28)}
                </text>
                <text className="iso-face-text" data-tone="hi" transform={slot.time} fontSize={3.2} textAnchor="end">
                  {`${item.sessionShort} · ${clockOf(item.checkedInAt)}`}
                </text>
              </g>
            );
          })}

          <g dangerouslySetInnerHTML={{ __html: ART_TRAY_FRONT }} />
        </svg>
      </div>
    </Plate>
  );
}

/** Barcode dekoratif yang stabil per ID kedatangan (lebar batang dari hash ID). */
function barcode(x0: number, x1: number, top: number, h: number, seed: string) {
  let hash = 2166136261;
  for (const ch of seed) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  const parts: string[] = [];
  let x = x0;
  while (x < x1 - 0.6) {
    hash = Math.imul(hash ^ (hash >>> 13), 2654435761) >>> 0;
    const w = 0.35 + (hash % 3) * 0.3;
    const gap = 0.4 + ((hash >>> 4) % 3) * 0.3;
    parts.push(`M${x.toFixed(2)} ${top.toFixed(2)}h${w.toFixed(2)}v${h}h${(-w).toFixed(2)}Z`);
    x += w + gap;
  }
  return parts.join("");
}
