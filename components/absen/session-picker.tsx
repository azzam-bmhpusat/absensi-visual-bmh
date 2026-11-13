"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { AttendanceDialog } from "./attendance-dialog";
import type { GuestItem } from "./name-combobox";

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

export function SessionPicker({
  sessions = [
    { id: 1, slug: "hari-1", nama: "Hari Pertama" },
    { id: 2, slug: "hari-2", nama: "Hari Kedua" },
  ],
  guests = [],
  daerahList = [],
}: SessionPickerProps) {
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  return (
    <>
      <div className="space-y-4 text-left">
        {sessions.map((session) => (
          <Card
            key={session.id}
            onClick={() => setSelectedSession(session)}
            className="group p-6 cursor-pointer rounded-3xl border-line transition-all hover:border-brand-green hover:-translate-y-1 shadow-sm hover:shadow-md flex items-center justify-between min-h-[140px] bg-card"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-green-100 text-primary font-heading font-bold text-2xl flex items-center justify-center shrink-0">
                {session.id}
              </div>
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-xl text-primary">
                  {session.nama}
                </h2>
                <p className="text-sm text-ink-muted">
                  {session.tanggal
                    ? `Tanggal: ${session.tanggal}`
                    : session.id === 1
                    ? "Sesi Pembukaan & Rakornas"
                    : "Sesi Pleno & Penutupan"}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center shrink-0 transition-all group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5 text-current" />
            </div>
          </Card>
        ))}
      </div>

      {selectedSession && (
        <AttendanceDialog
          sessionId={selectedSession.id as 1 | 2}
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
