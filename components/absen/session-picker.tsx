"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { AttendanceDialog } from "./attendance-dialog";

export function SessionPicker() {
  const [selectedSession, setSelectedSession] = useState<1 | 2 | null>(null);

  return (
    <>
      <div className="space-y-4 text-left">
        <Card
          onClick={() => setSelectedSession(1)}
          className="p-5 cursor-pointer rounded-2xl border-line transition-all hover:border-brand-green hover:-translate-y-0.5 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary text-primary font-heading font-bold text-xl flex items-center justify-center">
              1
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-primary">
                Hari Pertama
              </h2>
              <p className="text-xs text-ink-muted">Sesi Pembukaan & Rakor</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-gold" />
        </Card>

        <Card
          onClick={() => setSelectedSession(2)}
          className="p-5 cursor-pointer rounded-2xl border-line transition-all hover:border-brand-green hover:-translate-y-0.5 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary text-primary font-heading font-bold text-xl flex items-center justify-center">
              2
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-primary">
                Hari Kedua
              </h2>
              <p className="text-xs text-ink-muted">Sesi Pleno & Penutupan</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-gold" />
        </Card>
      </div>

      {selectedSession && (
        <AttendanceDialog
          sessionId={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}
    </>
  );
}
