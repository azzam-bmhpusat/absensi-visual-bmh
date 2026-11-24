"use client";

import { useEffect, useState } from "react";
import { EVENT_INFO } from "@/content/rakernas";
import { formatEventOpening, getEventStatus } from "@/lib/event-settings";
import { getTimeLeft, type TimeLeft } from "@/lib/rakernas-helpers";
import { Card } from "@/components/ui/card";
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
    const update = () => setFontSize(md.matches ? 60 : sm.matches ? 42 : 30);
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
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-xl md:text-3xl font-heading font-semibold text-brand-gold-soft">
          Hitung Mundur Acara
        </h2>
        <p className="mt-2 text-xs md:text-sm text-muted-foreground">
          Menuju pembukaan {EVENT_INFO.title} &bull; {formatEventOpening(target)}
        </p>

        <RevealStagger
          className="mt-6 md:mt-8 grid grid-cols-4 gap-2 sm:gap-3 md:gap-4"
          stagger={0.1}
          role="timer"
          aria-live="polite"
        >
          {COUNTDOWN_UNITS.map(({ key, label }) => (
            <RevealItem key={key} y={16}>
            <Card
              className="rounded-2xl border-brand-green/40 bg-brand-green/10 ring-1 ring-brand-green/20 backdrop-blur-xs px-2 pt-2 pb-2.5 sm:p-4 md:p-6 text-center shadow-lg transition-transform hover:scale-[1.02]"
            >
              <div className="flex h-8 sm:h-12 md:h-16 items-end sm:items-center justify-center">
                {!isMounted ? (
                  <Skeleton className="h-7 sm:h-10 md:h-14 w-12 sm:w-16 md:w-20 rounded-md bg-white/10" />
                ) : (
                  <span className="font-heading font-bold text-brand-gold-soft tabular-nums">
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
              <span className="mt-0 block leading-none text-xs md:text-sm font-medium uppercase tracking-wider text-white/90">
                {label}
              </span>
            </Card>
            </RevealItem>
          ))}
        </RevealStagger>

        {isMounted && timeLeft.isExpired && (
          <p className="mt-4 text-xs md:text-sm font-medium text-brand-green-text">
            {getEventStatus({ startsAt: target, endsAt }, now!) === "finished" ? "Acara telah selesai." : "Acara sedang berlangsung atau telah dimulai!"}
          </p>
        )}
      </div>
    </div>
  );
}
