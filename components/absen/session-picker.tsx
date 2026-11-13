"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight, Lock } from "lucide-react";
import { useState } from "react";
import { AttendanceDialog } from "./attendance-dialog";
import type { GuestItem } from "./name-combobox";
import { toast } from "sonner";

export interface SessionItem {
  id: number;
  slug: string;
  nama: string;
  tanggal?: string | null;
  is_active?: boolean;
}

interface SessionPickerProps {
  sessions?: SessionItem[];
  guests?: GuestItem[];
  daerahList?: string[];
}

function getDefaultSubtitle(sessionId: number): string {
  switch (sessionId) {
    case 1:
      return "Sesi Pembukaan & Rakornas";
    case 2:
      return "Sesi Pleno & Pembahasan";
    case 3:
      return "Sesi Penutupan & Doa Bersama";
    default:
      return "Sesi Pertemuan BMH";
  }
}

export function SessionPicker({
  sessions = [
    { id: 1, slug: "hari-1", nama: "Hari Pertama", is_active: true },
    { id: 2, slug: "hari-2", nama: "Hari Kedua", is_active: true },
    { id: 3, slug: "hari-3", nama: "Hari Ketiga", is_active: true },
  ],
  guests = [],
  daerahList = [],
}: SessionPickerProps) {
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

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
      <div className="space-y-3 sm:space-y-4 text-left w-full">
        {sessions.map((session) => {
          const isActive = session.is_active !== false;

          return (
            <Card
              key={session.id}
              onClick={() => handleCardClick(session)}
              className={`group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex items-center justify-between gap-3 min-h-[92px] sm:min-h-[108px] select-none ${
                isActive
                  ? "bg-card border-line hover:border-brand-green hover:shadow-xs active:scale-[0.98] cursor-pointer"
                  : "bg-surface/80 border-dashed border-line/80 opacity-75 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {/* Badge Nomor Hari */}
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl font-heading font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                    isActive
                      ? "bg-green-100 text-primary group-hover:bg-primary group-hover:text-white"
                      : "bg-muted text-ink-muted"
                  }`}
                >
                  {session.id}
                </div>

                {/* Info Sesi */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      className={`font-heading font-bold text-base sm:text-lg leading-tight truncate ${
                        isActive ? "text-primary" : "text-ink-muted"
                      }`}
                    >
                      {session.nama}
                    </h2>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-brand-green-deep border border-brand-green/20">
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
          );
        })}
      </div>

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
