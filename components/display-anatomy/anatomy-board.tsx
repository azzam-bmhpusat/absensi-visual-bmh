"use client";

import { useEffect, useMemo, useState } from "react";
import { CardRackFigure, type RackItem } from "@/components/figures/display/card-rack/card-rack-figure";
import { HallFigure } from "@/components/figures/display/hall/hall-figure";
import { ControlPanelFigure } from "@/components/figures/display/control-panel/control-panel-figure";
import { TimeClockFigure } from "@/components/figures/display/time-clock/time-clock-figure";
import type { DisplayAnatomyData } from "@/lib/display-anatomy-data";
import { clockOf } from "@/lib/live-attendance-model";
import { useDisplayRealtime } from "./use-display-realtime";
import "./anatomy-board.css";

/** Seluruh komponen /display sebagai figur Anatomy, pas 1 layar. */
export function AnatomyBoard({ eventName, sessions, activeSession, guests, attendances }: DisplayAnatomyData) {
  const live = useDisplayRealtime({ initialSession: activeSession, initialGuests: guests, initialAttendances: attendances });
  const idle = useIdleCursor();

  const hadirItems: RackItem[] = useMemo(
    () => live.hadir.map((a) => ({ id: a.id, title: a.nama, sub: a.perwakilan_daerah, meta: clockOf(a.checked_in_at) })),
    [live.hadir]
  );
  const belumItems: RackItem[] = useMemo(
    () => live.belumHadir.map((g) => ({ id: g.id, title: g.nama, sub: g.perwakilan_daerah })),
    [live.belumHadir]
  );

  const presentIds = useMemo(() => new Set(live.hadir.map((a) => a.guest_id).filter((id): id is string => Boolean(id))), [live.hadir]);
  const recentGuestIds = useMemo(() => {
    const recent = new Set(live.recentIds);
    return new Set(live.hadir.filter((a) => recent.has(a.id) && a.guest_id).map((a) => a.guest_id as string));
  }, [live.hadir, live.recentIds]);

  return (
    <div className={`da-board ${idle ? "cursor-none" : ""}`}>
      <section className="da-cell da-panel" aria-label="Panel kontrol">
        <ControlPanelFigure
          eventName={eventName}
          sessions={sessions}
          current={live.session}
          onSelect={live.selectSession}
          status={live.status}
          hadir={live.hadirCount}
          total={live.totalGuests}
        />
      </section>
      <section className="da-cell da-hall" aria-label="Aula kehadiran">
        <div className="da-sub da-sub-hall">
          <HallFigure guests={live.guests} presentIds={presentIds} recentGuestIds={recentGuestIds} hadir={live.hadirCount} total={live.totalGuests} />
        </div>
        <div className="da-sub da-sub-clock">
          <TimeClockFigure
            queue={live.welcome}
            onDone={live.dismissWelcome}
            hadir={live.hadirCount}
            belum={live.belumHadir.length}
            total={live.totalGuests}
          />
        </div>
      </section>
      <section className="da-cell da-rack">
        <CardRackFigure fig="Fig 3" title="Sudah Hadir" label="SUDAH HADIR" items={hadirItems} recentIds={live.recentIds} emptyText="Belum ada kehadiran" jumpToNewest />
      </section>
      <section className="da-cell da-rack">
        <CardRackFigure fig="Fig 4" title="Belum Hadir" label="BELUM HADIR" items={belumItems} emptyText="Semua tamu telah hadir!" />
      </section>
    </div>
  );
}

/** Kursor hilang setelah 3 detik diam (sama seperti /display). */
function useIdleCursor() {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 3000);
    };
    window.addEventListener("mousemove", reset);
    window.addEventListener("mousedown", reset);
    timer = setTimeout(() => setIdle(true), 3000);
    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("mousedown", reset);
      clearTimeout(timer);
    };
  }, []);
  return idle;
}
