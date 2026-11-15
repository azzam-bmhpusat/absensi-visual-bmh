"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { RUNDOWN_DATA } from "@/content/rakernas";
import { getDefaultDay, parseRundownTitle } from "@/lib/rakernas-helpers";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type DayKey = "hari1" | "hari2" | "hari3";

interface DayTabConfig {
  key: DayKey;
  label: string;
  sublabel: string;
}

const DAYS_CONFIG: DayTabConfig[] = [
  { key: "hari1", label: "Hari 1", sublabel: "Selasa, 01 Des 2026" },
  { key: "hari2", label: "Hari 2", sublabel: "Rabu, 02 Des 2026" },
  { key: "hari3", label: "Hari 3", sublabel: "Kamis, 03 Des 2026" },
];

const DAY_INDEX: Record<DayKey, number> = {
  hari1: 0,
  hari2: 1,
  hari3: 2,
};

export function RundownSection() {
  // Ambil default day via useSyncExternalStore agar tidak mengakses Date saat prerender/SSR
  const defaultDay = useSyncExternalStore(
    () => () => {},
    () => getDefaultDay(Date.now()),
    () => "hari1" as DayKey
  );

  const [userSelectedDay, setUserSelectedDay] = useState<DayKey | null>(null);
  const selectedDay = userSelectedDay ?? defaultDay;
  const [direction, setDirection] = useState<number>(0);
  const uniqueId = useId();
  const shouldReduceMotion = useReducedMotion();

  const handleTabChange = (val: string) => {
    const nextDay = val as DayKey;
    if (nextDay === selectedDay) return;
    const oldIdx = DAY_INDEX[selectedDay];
    const newIdx = DAY_INDEX[nextDay];
    setDirection(newIdx > oldIdx ? 1 : newIdx < oldIdx ? -1 : 0);
    setUserSelectedDay(nextDay);
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-5 md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl md:text-4xl font-heading font-semibold text-primary">
          Rundown Acara
        </h2>
        <p className="mt-2 md:mt-3 text-sm md:text-base text-ink-muted">
          Jadwal lengkap tiga hari kegiatan Rapat Kerja Nasional BMH 2027
        </p>
      </div>

      <div className="mx-auto mt-8 md:mt-12 max-w-3xl">
        <Tabs
          value={selectedDay}
          onValueChange={handleTabChange}
          className="w-full"
        >
          {/* Tabs List dengan grid-cols-3 penuh lebar & indikator meluncur */}
          <TabsList className="grid w-full grid-cols-3 group-data-horizontal/tabs:h-auto min-h-13 sm:min-h-15 rounded-2xl border border-line bg-surface p-1 sm:p-1.5 shadow-xs">
            {DAYS_CONFIG.map(({ key, label, sublabel }) => {
              const isActive = selectedDay === key;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className={cn(
                    "relative z-10 flex h-full flex-col items-center justify-center rounded-xl px-2 py-2 sm:py-2.5 text-center transition-colors duration-200",
                    "focus-visible:ring-2 focus-visible:ring-brand-green/30 focus-visible:outline-none",
                    "data-active:bg-transparent group-data-[variant=default]/tabs-list:data-active:shadow-none shadow-none cursor-pointer"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRundownIndicator"
                      className="absolute inset-0 rounded-xl bg-background shadow-xs border border-line"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 400, damping: 32 }
                      }
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 font-heading text-xs sm:text-sm font-semibold transition-colors duration-200",
                      isActive ? "text-primary font-bold" : "text-ink-muted hover:text-ink"
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 text-[10px] sm:text-xs transition-colors duration-200",
                      isActive ? "text-ink-muted font-medium" : "text-ink-muted/70"
                    )}
                  >
                    <span className="inline sm:hidden">
                      {sublabel.split(", ")[1]?.replace(" 2026", "") ?? sublabel}
                    </span>
                    <span className="hidden sm:inline">
                      {sublabel.split(" 2026")[0] ?? sublabel}
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {DAYS_CONFIG.map(({ key, label, sublabel }) => {
            const items = RUNDOWN_DATA[key];
            const isPending =
              items.length === 1 && items[0].time === "-";

            return (
              <TabsContent
                key={key}
                value={key}
                className="mt-6 focus-visible:outline-hidden"
              >
                <motion.div
                  key={`content-${key}`}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          x: direction === 0 ? 0 : direction > 0 ? 32 : -32,
                        }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 340,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="rounded-2xl border border-line bg-card p-5 sm:p-6 md:p-8 shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)]"
                >
                  {/* Header Hari */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 gap-1">
                    <div>
                      <h3 className="text-lg md:text-xl font-heading font-bold text-primary">
                        {label}
                      </h3>
                      <p className="text-xs md:text-sm text-ink-muted">
                        {sublabel}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-ink-muted">
                      {isPending ? "Belum dirilis" : `${items.length} sesi kegiatan`}
                    </span>
                  </div>

                  {/* Konten Timeline */}
                  {isPending ? (
                    <div className="my-8 rounded-xl border border-dashed border-line bg-surface/60 p-8 text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-gold-soft/30 text-brand-gold-text">
                        <span className="text-lg font-bold">!</span>
                      </div>
                      <h4 className="mt-3 font-heading text-base font-semibold text-primary">
                        {items[0].title}
                      </h4>
                      <p className="mt-1 text-xs md:text-sm text-ink-muted max-w-md mx-auto">
                        Jadwal resmi untuk {label} akan segera diperbarui oleh panitia Rakernas BMH.
                      </p>
                    </div>
                  ) : (
                    <div className="relative mt-6 pl-4 sm:pl-6 space-y-6 before:absolute before:left-1 sm:before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-line">
                      {items.map((item, index) => {
                        const { mainTitle, subtitle } = parseRundownTitle(
                          item.title,
                          item.note
                        );
                        const itemKey = `${uniqueId}-${key}-${index}`;

                        return (
                          <div
                            key={itemKey}
                            className="relative flex items-start gap-3 sm:gap-4 group"
                          >
                            {/* Titik Penanda Timeline */}
                            <span
                              className="absolute -left-4 sm:-left-6 top-1.5 flex size-2.5 sm:size-3 items-center justify-center rounded-full bg-background ring-2 ring-brand-green group-hover:bg-brand-green transition-colors"
                              aria-hidden="true"
                            />

                            {/* Badge Waktu */}
                            <Badge
                              variant="secondary"
                              className="w-16 shrink-0 justify-center font-mono text-[11px] sm:text-xs font-semibold tabular-nums bg-green-100 text-primary border border-line"
                            >
                              {item.time}
                            </Badge>

                            {/* Judul & Keterangan Acara */}
                            <div className="flex-1 pt-0.5 min-w-0">
                              <p className="text-sm sm:text-base font-medium text-ink leading-snug">
                                {mainTitle}
                              </p>
                              {subtitle && (
                                <p className="mt-0.5 text-xs sm:text-sm text-ink-muted">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
