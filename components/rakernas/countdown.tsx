"use client";

import { useEffect, useState } from "react";
import { EVENT_INFO } from "@/content/rakernas";
import { formatEventOpening, getEventStatus } from "@/lib/event-settings";
import { getTimeLeft, type TimeLeft } from "@/lib/rakernas-helpers";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RevealItem, RevealStagger } from "@/components/motion/reveal";
import Counter from "@/components/reactbits/counter";

interface CountdownUnit {
  key: keyof TimeLeft["formatted"];
  label: string;
}

const COUNTDOWN_UNITS: CountdownUnit[] = [
  { key: "days", label: "Hari" },
  { key: "hours", label: "Jam" },
  { key: "minutes", label: "Menit" },
  { key: "seconds", label: "Detik" },
];

const INITIAL_TIME_LEFT: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  formatted: {
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  },
  isExpired: false,
};

interface CountdownSectionProps {
  target?: string;
  endsAt?: string | null;
}

export function CountdownSection({
  target = EVENT_INFO.countdownTarget,
  endsAt = null,
}: CountdownSectionProps = {}) {
  const [now, setNow] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(36);

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const update = () => setFontSize(md.matches ? 56 : sm.matches ? 40 : 30);
    update();
    md.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const initialTick = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearTimeout(initialTick);
      clearInterval(interval);
    };
  }, []);

  const isMounted = now !== null;
  const timeLeft = isMounted ? getTimeLeft(target, now) : INITIAL_TIME_LEFT;

  return (
    <div className="site-container flex flex-col gap-[22px] lg:flex-row lg:items-center lg:justify-between lg:gap-20">
      <div className="flex flex-col gap-2.5 lg:max-w-[520px] lg:gap-3.5">
        <p className="text-[11px] font-bold tracking-[1.4px] text-brand-gold-text uppercase lg:text-xs lg:tracking-[1.6px]">
          Menuju Pembukaan
        </p>
        <h2 className="font-heading text-[28px]/[34px] font-bold text-primary lg:text-[40px]/[46px]">
          Hitung Mundur Acara
        </h2>
        <p className="flex items-center gap-1.5 text-[13px] text-[#4F7A72] lg:gap-2 lg:pb-1 lg:text-[15px]">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-[#1E7F62] lg:size-[18px]" />
          {formatEventOpening(target)}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 lg:items-end lg:gap-4">
        <p className="text-[10px] font-bold tracking-[1.4px] text-[#4F7A72] uppercase lg:text-[11px] lg:tracking-[1.6px]">
          Waktu Tersisa
        </p>
        <RevealStagger
          className="grid w-full grid-cols-4 gap-2 lg:flex lg:w-auto lg:gap-3"
          stagger={0.1}
          role="timer"
          aria-live="polite"
        >
          {COUNTDOWN_UNITS.map(({ key, label }) => (
            <RevealItem key={key} y={16}>
              <div className="flex h-[88px] flex-col items-center justify-center gap-0.5 rounded-[14px] bg-linear-to-br from-[#095046] to-[#04362F] text-center shadow-[0_8px_20px_-12px_#04362F] sm:h-[120px] lg:h-[148px] lg:w-32 lg:gap-1 lg:rounded-[20px]">
                <div className="flex items-center justify-center">
                  {!isMounted ? (
                    <Skeleton className="h-8 w-10 rounded-md bg-white/10 lg:h-14 lg:w-16" />
                  ) : (
                    <span className="font-heading font-bold text-brand-gold tabular-nums">
                      <span className="sr-only">{timeLeft.formatted[key]}</span>
                      <Counter
                        value={timeLeft[key]}
                        places={key === "days" && timeLeft.days > 99 ? [100, 10, 1] : [10, 1]}
                        fontSize={fontSize}
                        fontWeight={700}
                      />
                    </span>
                  )}
                </div>
                <span className="text-[9px] leading-none font-semibold tracking-[1px] text-white/70 uppercase lg:text-[11px] lg:tracking-[1.4px]">
                  {label}
                </span>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
        {isMounted && timeLeft.isExpired && (
          <p className="text-xs font-medium text-primary md:text-sm">
            {getEventStatus({ startsAt: target, endsAt }, now!) === "finished" ? "Acara telah selesai." : "Acara sedang berlangsung atau telah dimulai!"}
          </p>
        )}
      </div>
    </div>
  );
}
