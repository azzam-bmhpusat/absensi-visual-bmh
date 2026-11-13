"use client";

import { useEffect, useState } from "react";
import { formatWibClock } from "@/lib/display-helpers";

interface DisplayHeaderProps {
  eventName: string;
  sessionName: string;
}

export function DisplayHeader({ eventName, sessionName }: DisplayHeaderProps) {
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    const update = () => setClock(formatWibClock());

    // Tick pertama secara asinkron agar tidak memicu cascading renders
    const initialTimer = setTimeout(update, 0);
    const interval = setInterval(update, 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="flex items-center justify-between min-h-[90px] border-b border-border/40 pb-4">
      <div className="flex flex-col justify-center">
        <span className="text-sm uppercase tracking-wider font-semibold text-brand-gold-soft">
          Layar Kehadiran Realtime
        </span>
        <h1 className="text-4xl xl:text-5xl font-heading font-bold text-white tracking-tight leading-tight">
          {eventName}
        </h1>
      </div>

      <div className="text-right flex flex-col justify-center items-end">
        <div className="text-2xl xl:text-3xl font-heading font-bold text-brand-gold-soft">
          {sessionName}
        </div>
        <div className="text-lg xl:text-xl font-mono font-medium text-white/90 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
          <span>{clock || "--:--:-- WIB"}</span>
        </div>
      </div>
    </header>
  );
}
