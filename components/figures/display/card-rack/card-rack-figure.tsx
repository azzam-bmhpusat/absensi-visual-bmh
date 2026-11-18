"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plate } from "@/components/iso/draw";
import { spring, useLoop, useReadout, useStillness, type Spring } from "@/components/iso/live";
import { fitText, nextPage, pagesOf } from "@/lib/display-anatomy-model";
import {
  ART_BACK,
  CARD_H,
  CARD_W,
  COLS,
  FACE_PLANE,
  HEIGHT,
  LCD,
  LCD_PLANE,
  LCD_RIM,
  PER_PAGE,
  RIGHT_POST,
  ROWS,
  SINK,
  SINK_VECTOR,
  WIDTH,
  cardSolid,
  colX,
  dialPointer,
  lipOf,
  rowClip,
  rowZ,
} from "./geometry";

const PAGE_MS = 8000;

export interface RackItem {
  id: string;
  title: string;
  sub: string;
  meta?: string;
}

export interface CardRackProps {
  fig: string;
  title: string;
  /** Teks di LCD kepala rak, mis. "SUDAH HADIR" */
  label: string;
  items: RackItem[];
  recentIds?: string[];
  emptyText: string;
  /** Lompat ke halaman pertama saat ada id baru (rak Hadir: terbaru di atas). */
  jumpToNewest?: boolean;
}

// Badan kartu per slot, dihitung sekali (biasa & menyala)
const SLOTS = Array.from({ length: PER_PAGE }, (_, i) => {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  return { row, col, plain: cardSolid(row, col, false), lit: cardSolid(row, col, true) };
});
const LIPS = Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLS }, (_, col) => lipOf(row, col)).join(""));

export function CardRackFigure({ fig, title, label, items, recentIds = [], emptyText, jumpToNewest = false }: CardRackProps) {
  const uid = useId().replace(/[:«»]/g, "");
  const { anchor, say } = useReadout<SVGSVGElement>();
  const still = useStillness();
  const pages = useMemo(() => pagesOf(items, PER_PAGE), [items]);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const shown = page % pages.length;
  const motion = useRef<{ sink: Spring; target: number; pending: number | null }>({ sink: { at: 0, rate: 0 }, target: 0, pending: null });

  const kick = useLoop((dt, calm) => {
    const m = motion.current;
    const settled = spring(m.sink, m.target, dt, 60, 14, calm);
    if (m.target === 1 && m.sink.at > 0.97 && m.pending !== null) {
      setPage(m.pending);
      m.pending = null;
      m.target = 0;
    }
    const drop = m.sink.at * SINK;
    const transform = `translate(${(SINK_VECTOR[0] * drop).toFixed(2)} ${(SINK_VECTOR[1] * drop).toFixed(2)})`;
    anchor.current?.querySelectorAll("[data-sink]").forEach((node) => node.setAttribute("transform", transform));
    return !(settled && m.target === 0 && m.pending === null);
  }, false);

  const flipTo = (next: number) => {
    if (still) {
      setPage(next);
      return;
    }
    motion.current.pending = next;
    motion.current.target = 1;
    kick();
  };
  const flipRef = useRef(flipTo);
  useEffect(() => {
    flipRef.current = flipTo;
  });

  // Ganti halaman otomatis
  useEffect(() => {
    if (paused || pages.length <= 1) return;
    const id = setInterval(() => flipRef.current(nextPage(shown, pages.length)), PAGE_MS);
    return () => clearInterval(id);
  }, [paused, pages.length, shown]);

  // Kartu baru di rak Hadir: tampilkan halaman pertama
  const newest = recentIds[recentIds.length - 1];
  useEffect(() => {
    if (!jumpToNewest || !newest) return;
    const t = setTimeout(() => flipRef.current(0), 0);
    return () => clearTimeout(t);
  }, [newest, jumpToNewest]);

  const readout = `Hal ${shown + 1}/${pages.length} · ${items.length} nama${paused ? " · jeda" : ""}`;
  useEffect(() => say(readout), [readout, say]);

  const current = pages[shown] ?? [];
  const recent = new Set(recentIds);
  const pointer = dialPointer(pages.length > 1 ? (shown / pages.length) * 360 : 0);

  return (
    <Plate fig={fig} title={title} hint="Klik: jeda / lanjut" readout={readout}>
      <div className="iso-stage">
        <svg
          ref={anchor}
          className="iso-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          tabIndex={0}
          aria-label={`Rak kartu ${label.toLowerCase()}: ${items.length} nama, halaman ${shown + 1} dari ${pages.length}.`}
          style={{ cursor: "pointer" }}
          onClick={() => setPaused((p) => !p)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setPaused((p) => !p);
            } else if (e.key === "ArrowRight") flipTo(nextPage(shown, pages.length));
            else if (e.key === "ArrowLeft") flipTo((shown - 1 + pages.length) % pages.length);
          }}
        >
          <defs>
            {Array.from({ length: ROWS }, (_, row) => (
              <clipPath key={row} id={`${uid}-row-${row}`} dangerouslySetInnerHTML={{ __html: rowClip(row) }} />
            ))}
          </defs>
          <g dangerouslySetInnerHTML={{ __html: ART_BACK }} />

          {/* LCD kepala rak */}
          <g transform={LCD_PLANE}>
            <text className="da-ink" x={LCD.x0 + 6} y={-(LCD.z1 - 12)} fontSize={10}>
              {label}
            </text>
            <text className="da-ink-dim" x={LCD.x0 + 6} y={-(LCD.z0 + 6)} fontSize={7}>
              {`HAL ${shown + 1}/${pages.length}${paused ? " · JEDA" : ""}`}
            </text>
            <text className="da-ink-gold" x={LCD.x1 - 6} y={-(LCD.z0 + 7)} fontSize={20} textAnchor="end">
              {items.length}
            </text>
          </g>
          <g dangerouslySetInnerHTML={{ __html: LCD_RIM }} />
          <path className="iso-line" data-tone="lit" d={pointer} />

          {/* Baris saku: kartu (diklip di atas dasar saku) lalu bibir saku di depannya */}
          {Array.from({ length: ROWS }, (_, row) => (
            <g key={row}>
              <g clipPath={`url(#${uid}-row-${row})`}>
                <g data-sink="">
                  {items.length === 0 && row === 0 ? (
                    <g>
                      <g dangerouslySetInnerHTML={{ __html: SLOTS[0].lit }} />
                      <g transform={FACE_PLANE}>
                        <text className="da-ink-gold" x={colX(0) + 6} y={-(rowZ(0) + 2 + CARD_H - 15)} fontSize={8}>
                          {fitText(emptyText, 26)}
                        </text>
                      </g>
                    </g>
                  ) : null}
                  {SLOTS.filter((s) => s.row === row).map((slot) => {
                    const item = current[slot.row * COLS + slot.col];
                    if (!item) return null;
                    const isRecent = recent.has(item.id);
                    const x = colX(slot.col);
                    const top = rowZ(row) + 2 + CARD_H;
                    return (
                      <g key={item.id}>
                        <g dangerouslySetInnerHTML={{ __html: isRecent ? slot.lit : slot.plain }} />
                        <g transform={FACE_PLANE}>
                          {isRecent ? <rect className="da-gold-line" x={x + 1.5} y={-(top - 1.5)} width={CARD_W - 3} height={26} rx={1} /> : null}
                          <text className="da-ink" x={x + 6} y={-(top - 11.5)} fontSize={10.5}>
                            {fitText(item.title, 21)}
                          </text>
                          <text className="da-ink-dim" x={x + 6} y={-(top - 21.5)} fontSize={7}>
                            {fitText(item.sub, item.meta ? 22 : 30)}
                          </text>
                          {item.meta ? (
                            <text className={isRecent ? "da-ink-gold" : "da-ink-dim"} x={x + CARD_W - 6} y={-(top - 21.5)} fontSize={7} textAnchor="end">
                              {item.meta}
                            </text>
                          ) : null}
                        </g>
                      </g>
                    );
                  })}
                </g>
              </g>
              <g dangerouslySetInnerHTML={{ __html: LIPS[row] }} />
            </g>
          ))}

          <g dangerouslySetInnerHTML={{ __html: RIGHT_POST }} />
        </svg>
      </div>
    </Plate>
  );
}
