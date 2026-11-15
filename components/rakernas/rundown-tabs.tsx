"use client";

import { useId, useState, useSyncExternalStore } from "react";
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

export function RundownSection() {
  // Ambil default day via useSyncExternalStore agar tidak mengakses Date saat prerender/SSR
  const defaultDay = useSyncExternalStore(
    () => () => {},
    () => getDefaultDay(Date.now()),
    () => "hari1" as DayKey
  );

  const [userSelectedDay, setUserSelectedDay] = useState<DayKey | null>(null);
  const selectedDay = userSelectedDay ?? defaultDay;
  const uniqueId = useId();

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
          onValueChange={(val) => setUserSelectedDay(val as DayKey)}
          className="w-full"
        >
          {/* Tabs List dengan grid-cols-3 penuh lebar */}
          <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl border border-line bg-surface p-1">
            {DAYS_CONFIG.map(({ key, label }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="h-10 text-xs sm:text-sm font-heading font-semibold data-active:bg-background data-active:text-primary data-active:shadow-xs transition-all"
              >
                {label}
              </TabsTrigger>
            ))}
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
                <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 md:p-8 shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)]">
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
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
