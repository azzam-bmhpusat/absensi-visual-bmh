"use client";

import { useEffect, useMemo, useState } from "react";
import { Plate } from "@/components/iso/draw";
import { useReadout } from "@/components/iso/live";
import { fitText, hallReadout, seatLayout, type SeatGuest } from "@/lib/display-anatomy-model";
import { HEIGHT, WIDTH, buildHall } from "./geometry";

const TOUR_MS = 3500;

export interface HallProps {
  guests: SeatGuest[];
  /** guest_id tamu yang hadir di sesi ini */
  presentIds: Set<string>;
  /** guest_id tamu yang baru hadir (disorot 5 detik) */
  recentGuestIds: Set<string>;
  hadir: number;
  total: number;
}

/** Fig 1 · Aula — satu kursi per tamu; sosok duduk = hadir. Hover/sentuh kursi untuk melihat namanya. */
export function HallFigure({ guests, presentIds, recentGuestIds, hadir, total }: HallProps) {
  const { anchor, say } = useReadout<SVGSVGElement>();
  const layout = useMemo(() => seatLayout(guests), [guests]);
  const art = useMemo(() => buildHall(layout), [layout]);
  const [hover, setHover] = useState<number | null>(null);
  const [tour, setTour] = useState<number | null>(null);

  // Tur diam: sorot bergantian tamu yang baru hadir, agar namanya terbaca dari jauh
  const recentSeats = useMemo(
    () => layout.seats.map((s, i) => (recentGuestIds.has(s.guestId) ? i : -1)).filter((i) => i >= 0),
    [layout, recentGuestIds]
  );
  useEffect(() => {
    if (recentSeats.length === 0) {
      const t = setTimeout(() => setTour(null), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    const show = () => setTour(recentSeats[i++ % recentSeats.length]);
    const first = setTimeout(show, 0);
    const id = setInterval(show, TOUR_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [recentSeats]);

  const focus = hover ?? tour;
  const focusSeat = focus !== null ? layout.seats[focus] : null;
  const readout = focusSeat
    ? `${fitText(focusSeat.nama, 22)} · ${presentIds.has(focusSeat.guestId) ? "hadir" : "belum"}`
    : hallReadout(hadir, total);
  useEffect(() => say(readout), [readout, say]);

  return (
    <Plate fig="Fig 1" title="Aula" hint="Sentuh kursi: lihat nama" readout={readout}>
      <div className="iso-stage">
        <svg
          ref={anchor}
          className="iso-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Aula dengan ${total} kursi tamu; ${hadir} sudah hadir.`}
          onPointerLeave={() => setHover(null)}
        >
          <g dangerouslySetInnerHTML={{ __html: art.back }} />
          {/* Penanda fokus: cincin emas di lantai sekeliling kursi yang disorot (di bawah kursi) */}
          {focus !== null ? <path className="da-gold-line" d={art.seats.find((s) => s.index === focus)?.ring} /> : null}
          {art.seats.map((seat) => {
            const info = layout.seats[seat.index];
            const present = presentIds.has(info.guestId);
            const lit = present && (recentGuestIds.has(info.guestId) || focus === seat.index);
            const html = present ? (lit ? seat.personLit : seat.person) : seat.empty;
            return <g key={info.guestId} data-present={present ? "" : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
          })}
          {/* Area sentuh (di atas semua gambar) */}
          {art.seats.map((seat) => (
            <circle key={seat.index} data-hit="" cx={seat.hit[0]} cy={seat.hit[1]} r={seat.hitR} onPointerEnter={() => setHover(seat.index)} />
          ))}
          <g dangerouslySetInnerHTML={{ __html: art.front }} />
        </svg>
      </div>
    </Plate>
  );
}
