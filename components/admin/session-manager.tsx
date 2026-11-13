"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Unlock,
  Calendar,
  Users,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { toggleSessionStatusAction } from "@/app/admin/actions";

export interface AdminSessionItem {
  id: number;
  slug: string;
  nama: string;
  tanggal?: string | null;
  is_active: boolean;
}

interface SessionManagerProps {
  initialSessions: AdminSessionItem[];
  attendancesCountBySession?: Record<number, number>;
}

export function SessionManager({
  initialSessions,
  attendancesCountBySession = {},
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<AdminSessionItem[]>(initialSessions);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (session: AdminSessionItem) => {
    const nextStatus = !session.is_active;
    const actionLabel = nextStatus ? "membuka" : "menutup";

    setLoadingId(session.id);
    startTransition(async () => {
      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === session.id ? { ...s, is_active: nextStatus } : s
        )
      );

      const res = await toggleSessionStatusAction(session.id, nextStatus);
      setLoadingId(null);

      if (res.success) {
        toast.success(
          `Sesi ${session.nama} berhasil ${nextStatus ? "dibuka" : "ditutup"}.`
        );
      } else {
        // Rollback jika gagal
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id ? { ...s, is_active: session.is_active } : s
          )
        );
        toast.error(res.error || `Gagal ${actionLabel} sesi.`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Kartu Informasi */}
      <div className="p-4 rounded-2xl bg-secondary/60 border border-brand-green/20 flex items-start gap-3 text-xs text-primary leading-relaxed">
        <Info className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Kendali Presensi Acara:</span> Saat status
          sesi diubah menjadi <strong>Ditutup</strong>, peserta yang membuka
          tautan <code>/absen</code> tidak dapat mengisi kehadiran untuk sesi
          tersebut. Aktifkan kembali sesi saat waktu rapat/agenda kehadiran telah
          dimulai.
        </div>
      </div>

      {/* Daftar Sesi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessions.map((session) => {
          const isActive = session.is_active;
          const count = attendancesCountBySession[session.id] || 0;
          const isLoadingThis = isPending && loadingId === session.id;

          return (
            <Card
              key={session.id}
              className={`rounded-2xl border transition-all ${
                isActive
                  ? "bg-white border-line shadow-xs hover:border-brand-green/50"
                  : "bg-surface/80 border-dashed border-line/80 opacity-90"
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  {/* Header Sesi */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl font-heading font-bold text-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-green-100 text-primary"
                            : "bg-muted text-ink-muted"
                        }`}
                      >
                        {session.id}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-primary leading-tight">
                          {session.nama}
                        </h3>
                        <p className="text-[11px] font-mono text-ink-muted">
                          slug: {session.slug}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isActive ? (
                      <Badge className="bg-green-100 text-brand-green-deep border-brand-green/30 hover:bg-green-100 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                        Buka
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-muted text-ink-muted border-line text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shrink-0"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        Ditutup
                      </Badge>
                    )}
                  </div>

                  {/* Metrik & Tanggal */}
                  <div className="space-y-1.5 pt-2 border-t border-line/50 text-xs">
                    <div className="flex items-center justify-between text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-green" />
                        Kehadiran Masuk:
                      </span>
                      <span className="font-semibold text-primary font-mono">
                        {count} Tamu
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-gold-text" />
                        Tanggal:
                      </span>
                      <span className="text-[11px] font-medium text-foreground">
                        {session.tanggal || "Sesuai Jadwal"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Buka/Tutup */}
                <div className="pt-2">
                  <Button
                    onClick={() => handleToggle(session)}
                    disabled={isPending}
                    variant={isActive ? "outline" : "default"}
                    className={`w-full h-10 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isActive
                        ? "border-danger/30 text-danger hover:bg-danger/10 hover:border-danger hover:text-danger"
                        : "bg-primary hover:bg-brand-green-deep text-white shadow-xs"
                    }`}
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Memproses...
                      </>
                    ) : isActive ? (
                      <>
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Tutup Sesi
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 mr-1.5 text-brand-gold-soft" />
                        Buka Sesi
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
