"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Lock, CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { AttendanceDialog } from "./attendance-dialog";
import type { GuestItem } from "./name-combobox";
import { toast } from "sonner";
import { RevealItem, RevealStagger } from "@/components/motion/reveal";

export interface SessionItem {
  id: number;
  slug: string;
  nama: string;
  hari?: number;
  tanggal?: string | null;
  is_active?: boolean;
}

interface SessionPickerProps {
  sessions?: SessionItem[];
  guests?: GuestItem[];
  daerahList?: string[];
}

function getDefaultSubtitle(sessionId: number): string {
  const mod = sessionId % 3;
  if (mod === 1) return "Sesi pagi hari pembukaan & agenda utama";
  if (mod === 2) return "Sesi lanjutan setelah istirahat siang & sholat";
  return "Sesi evaluasi malam setelah makan malam";
}

const DEFAULT_SESSIONS: SessionItem[] = [
  { id: 1, slug: "hari-1-pagi", nama: "Absen Masuk Pagi", hari: 1, is_active: true },
  { id: 2, slug: "hari-1-isoma", nama: "Masuk Setelah Isoma", hari: 1, is_active: true },
  { id: 3, slug: "hari-1-malam", nama: "Masuk Setelah Makan Malam", hari: 1, is_active: true },
  { id: 4, slug: "hari-2-pagi", nama: "Absen Masuk Pagi", hari: 2, is_active: true },
  { id: 5, slug: "hari-2-isoma", nama: "Masuk Setelah Isoma", hari: 2, is_active: true },
  { id: 6, slug: "hari-2-malam", nama: "Masuk Setelah Makan Malam", hari: 2, is_active: true },
  { id: 7, slug: "hari-3-pagi", nama: "Absen Masuk Pagi", hari: 3, is_active: true },
  { id: 8, slug: "hari-3-isoma", nama: "Masuk Setelah Isoma", hari: 3, is_active: true },
  { id: 9, slug: "hari-3-malam", nama: "Masuk Setelah Makan Malam", hari: 3, is_active: true },
];

export function SessionPicker({
  sessions = DEFAULT_SESSIONS,
  guests = [],
  daerahList = [],
}: SessionPickerProps) {
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  // Normalisasi data sesi: pastikan setiap sesi memiliki field hari
  const normalizedSessions = useMemo(() => {
    return sessions.map((s) => ({
      ...s,
      hari: s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3),
    }));
  }, [sessions]);

  // Kelompokkan sesi berdasarkan hari (1, 2, 3)
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, SessionItem[]>();
    [1, 2, 3].forEach((h) => map.set(h, []));

    normalizedSessions.forEach((s) => {
      const h = s.hari ?? 1;
      const list = map.get(h) || [];
      list.push(s);
      map.set(h, list);
    });

    return map;
  }, [normalizedSessions]);

  const handleCardClick = (session: SessionItem) => {
    const isActive = session.is_active !== false;
    if (!isActive) {
      toast.info(`Presensi untuk ${session.nama} saat ini sedang ditutup.`);
      return;
    }
    setSelectedSession(session);
  };

  return (
    <>
      <Tabs defaultValue="hari-1" className="w-full space-y-4">
        <TabsList className="bg-muted/80 p-1 rounded-2xl h-11 border border-line grid grid-cols-3 w-full">
          <TabsTrigger
            value="hari-1"
            className="rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-2xs transition-all flex items-center justify-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5 text-brand-green-text" />
            Hari 1
          </TabsTrigger>
          <TabsTrigger
            value="hari-2"
            className="rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-2xs transition-all flex items-center justify-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5 text-brand-gold-text" />
            Hari 2
          </TabsTrigger>
          <TabsTrigger
            value="hari-3"
            className="rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-2xs transition-all flex items-center justify-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
            Hari 3
          </TabsTrigger>
        </TabsList>

        {[1, 2, 3].map((dayNumber) => {
          const daySessions = sessionsByDay.get(dayNumber) || [];

          return (
            <TabsContent
              key={`hari-${dayNumber}`}
              value={`hari-${dayNumber}`}
              className="text-left w-full mt-0 focus-visible:outline-none"
            >
              <RevealStagger immediate stagger={0.07} className="space-y-3 sm:space-y-4">
              {daySessions.map((session, idx) => {
                const isActive = session.is_active !== false;
                const sessionOrderInDay = idx + 1;

                return (
                  <RevealItem key={session.id} y={14}>
                  <Card
                    onClick={() => handleCardClick(session)}
                    className={`group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex items-center justify-between gap-3 min-h-[92px] sm:min-h-[104px] select-none ${
                      isActive
                        ? "bg-card border-line hover:border-ring hover:shadow-xs active:scale-[0.98] cursor-pointer"
                        : "bg-surface/80 border-dashed border-line/80 opacity-75 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      {/* Badge Nomor Sesi dalam hari tersebut (1, 2, 3) */}
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl font-heading font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                          isActive
                            ? "bg-green-100 text-primary group-hover:bg-primary group-hover:text-white"
                            : "bg-muted text-ink-muted"
                        }`}
                      >
                        {sessionOrderInDay}
                      </div>

                      {/* Info Sesi */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2
                            className={`font-heading font-bold text-sm sm:text-base leading-tight truncate ${
                              isActive ? "text-primary" : "text-ink-muted"
                            }`}
                          >
                            {session.nama}
                          </h2>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-brand-green-deep border border-brand-green/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                              Buka
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-ink-muted border border-line">
                              <Lock className="w-2.5 h-2.5" />
                              Ditutup
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-ink-muted line-clamp-1">
                          {session.tanggal
                            ? `Tanggal: ${session.tanggal}`
                            : getDefaultSubtitle(session.id)}
                        </p>
                      </div>
                    </div>

                    {/* Action Indicator Icon */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? "bg-secondary text-primary group-hover:bg-primary group-hover:text-white group-hover:translate-x-0.5"
                          : "bg-muted/70 text-ink-muted/50"
                      }`}
                    >
                      {isActive ? (
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
                      ) : (
                        <Lock className="w-4 h-4 text-current" />
                      )}
                    </div>
                  </Card>
                  </RevealItem>
                );
              })}
              </RevealStagger>
            </TabsContent>
          );
        })}
      </Tabs>

      {selectedSession && (
        <AttendanceDialog
          sessionId={selectedSession.id}
          sessionNama={selectedSession.nama}
          guests={guests}
          daerahList={daerahList}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}
    </>
  );
}
