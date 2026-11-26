"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import { RUNDOWN_DATA, type RundownItem } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS, formatEventDay, getEventDays } from "@/lib/event-settings";
import { getDefaultDay, parseRundownTitle } from "@/lib/rakernas-helpers";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type DayKey = "hari1" | "hari2" | "hari3";

interface DayTabConfig {
  key: DayKey;
  label: string;
  sublabel: string;
  compactLabel: string;
}

const DAY_INDEX: Record<DayKey, number> = {
  hari1: 0,
  hari2: 1,
  hari3: 2,
};

function timeBadgeColor(title: string) {
  const t = title.toLowerCase();
  if (t.includes("coffee break")) return "bg-[#FFF7E8] text-[#9A6A12]";
  if (t.includes("ishoma")) return "bg-sky-50 text-sky-800";
  if (t.includes("shalat")) return "bg-[#EDE7FB] text-[#5B3FA8]";
  return "bg-[#EEF8F3] text-[#1E7F62]";
}

/** Jumlah agenda yang tampil sebelum tombol "Lihat seluruh agenda". */
const COLLAPSED_COUNT = 9;

/** Kelompokkan baris berurutan dengan `section` sama. */
function groupBySection(items: RundownItem[]) {
  const groups: { section?: string; items: { item: RundownItem; index: number }[] }[] = [];
  items.forEach((item, index) => {
    const last = groups.at(-1);
    if (last && last.section === item.section) last.items.push({ item, index });
    else groups.push({ section: item.section, items: [{ item, index }] });
  });
  return groups;
}

export function RundownSection({ startsAt = DEFAULT_EVENT_SETTINGS.startsAt }: { startsAt?: string } = {}) {
  const daysConfig: DayTabConfig[] = getEventDays(startsAt).map((date, index) => ({
    key: `hari${index + 1}` as DayKey,
    label: `Hari ${index + 1}`,
    sublabel: formatEventDay(date, { weekday: "long", month: "short" }),
    compactLabel: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(`${date}T12:00:00+07:00`)),
  }));
  // Ambil default day via useSyncExternalStore agar tidak mengakses Date saat prerender/SSR
  const defaultDay = useSyncExternalStore(
    () => () => {},
    () => getDefaultDay(Date.now(), startsAt),
    () => "hari1" as DayKey
  );

  const [userSelectedDay, setUserSelectedDay] = useState<DayKey | null>(null);
  const selectedDay = userSelectedDay ?? defaultDay;
  const [direction, setDirection] = useState<number>(0);
  const [expanded, setExpanded] = useState(false);
  const uniqueId = useId();
  const shouldReduceMotion = useReducedMotion();

  const handleTabChange = (val: string) => {
    const nextDay = val as DayKey;
    if (nextDay === selectedDay) return;
    const oldIdx = DAY_INDEX[selectedDay];
    const newIdx = DAY_INDEX[nextDay];
    setDirection(newIdx > oldIdx ? 1 : newIdx < oldIdx ? -1 : 0);
    setUserSelectedDay(nextDay);
    setExpanded(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center md:gap-3">
        <p className="text-[11px] font-semibold tracking-[2px] text-[#1E7F62] uppercase md:text-xs md:tracking-[2.4px]">
          Jadwal Kegiatan
        </p>
        <h2 className="font-heading text-[28px] font-bold text-primary md:text-[40px]">Rundown Acara</h2>
        <p className="text-sm/[21px] text-[#4F7A72] md:text-base">
          Jadwal lengkap tiga hari kegiatan Rapat Kerja Nasional BMH 2027
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-[880px] md:mt-10">
        <Tabs value={selectedDay} onValueChange={handleTabChange} className="w-full gap-0">
          <TabsList className="relative grid w-full grid-cols-3 gap-1.5 rounded-[20px] border border-white/80 bg-white/80 bg-linear-to-b from-white/50 via-white/0 via-60% to-white/0 p-1.5 shadow-[0_8px_24px_#04362F14,inset_0_1px_0_#FFFFFFE6] backdrop-blur-md group-data-horizontal/tabs:h-auto md:rounded-full">
            {daysConfig.map(({ key, label, sublabel, compactLabel }, index) => {
              const isActive = selectedDay === key;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className={cn(
                    "relative z-10 flex h-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-0 p-2 text-left shadow-none transition-colors md:justify-start md:gap-3 md:rounded-full md:py-2.5 md:pr-5 md:pl-2.5",
                    "focus-visible:ring-2 focus-visible:ring-brand-green/30 focus-visible:outline-none",
                    "data-active:bg-transparent group-data-[variant=default]/tabs-list:data-active:shadow-none",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRundownIndicator"
                      className="absolute inset-0 rounded-[14px] bg-linear-to-b from-[#0B6355] to-[#04362F] shadow-[0_6px_16px_#09504640,inset_0_1px_0_#FFFFFF33] md:rounded-full"
                      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 size-7 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold md:flex md:size-9",
                      isActive ? "flex bg-brand-gold text-[#04362F]" : "hidden bg-[#EEF8F3] text-[#1E7F62]",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="relative z-10 flex flex-col gap-0.5">
                    <span className={cn("text-sm font-bold md:text-[15px]", isActive ? "text-white" : "text-[#073B33]")}>{label}</span>
                    <span className={cn("text-xs md:text-[13px]", isActive ? "text-white/70" : "text-[#4F7A72]")}>
                      <span className="md:hidden">{compactLabel}</span>
                      <span className="hidden md:inline">{sublabel}</span>
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {daysConfig.map(({ key, label }) => {
            const items = RUNDOWN_DATA[key];
            const isPending = items.length === 1 && items[0].time === "-";
            const canCollapse = items.length > COLLAPSED_COUNT;
            const visible = expanded || !canCollapse ? items : items.slice(0, COLLAPSED_COUNT);

            return (
              <TabsContent key={key} value={key} className="mt-5 focus-visible:outline-hidden md:mt-6">
                <motion.div
                  key={`content-${key}`}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction === 0 ? 0 : direction > 0 ? 32 : -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.8 }}
                  className="flex flex-col gap-6 rounded-[20px] bg-white px-5 py-6 outline-1 -outline-offset-[0.5px] outline-[#DCE8E5] md:gap-8 md:rounded-3xl md:px-12 md:py-10"
                >
                  {isPending ? (
                    <div className="rounded-xl border border-dashed border-line bg-surface/60 p-8 text-center">
                      <h3 className="font-heading text-base font-semibold text-primary">{items[0].title}</h3>
                      <p className="mx-auto mt-1 max-w-md text-xs text-ink-muted md:text-sm">
                        Jadwal resmi untuk {label} akan segera diperbarui oleh panitia Rakernas BMH.
                      </p>
                    </div>
                  ) : (
                    <>
                      {groupBySection(visible).map((group, gi) => (
                        <section key={`${uniqueId}-${key}-g${gi}`} className="flex flex-col gap-0.5 md:gap-1">
                          {group.section && (
                            <h3 className="flex items-center gap-2 pb-1.5 font-heading text-[15px] font-semibold text-primary md:gap-2.5 md:pb-2 md:text-[17px]">
                              <span aria-hidden="true" className="h-4 w-1 rounded-[2px] bg-brand-gold md:h-[18px]" />
                              {group.section}
                            </h3>
                          )}
                          <ul>
                            {group.items.map(({ item, index }) => {
                              const { mainTitle, subtitle } = item.note
                                ? parseRundownTitle(item.title, item.note)
                                : { mainTitle: item.title, subtitle: undefined };
                              return (
                                <li
                                  key={`${uniqueId}-${key}-${index}`}
                                  className="flex flex-col items-start gap-1.5 border-b border-[#DCE8E5] py-2.5 last:border-b-0 md:flex-row md:items-center md:gap-5 md:py-3"
                                >
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums md:w-[132px] md:px-0 md:py-1.5 md:text-center md:text-xs",
                                      timeBadgeColor(item.title),
                                    )}
                                  >
                                    {item.time.replace(" - ", " – ")}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm/[21px] text-[#073B33] md:text-[15px]/[23px]">{mainTitle}</p>
                                    {subtitle && <p className="mt-0.5 text-xs text-ink-muted md:text-sm">{subtitle}</p>}
                                    {item.details && item.details.length > 0 && (
                                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-ink-muted marker:font-medium marker:text-primary md:text-sm">
                                        {item.details.map((detail) => (
                                          <li key={detail}>{detail}</li>
                                        ))}
                                      </ol>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      ))}
                      {canCollapse && (
                        <button
                          type="button"
                          onClick={() => setExpanded((v) => !v)}
                          aria-expanded={expanded}
                          className="mx-auto flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:gap-2 md:text-sm"
                        >
                          {expanded ? `Ringkas agenda ${label}` : `Lihat seluruh agenda ${label}`}
                          <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", expanded && "rotate-180")} />
                        </button>
                      )}
                    </>
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
