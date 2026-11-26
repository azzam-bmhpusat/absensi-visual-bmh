import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import {
  DashboardStatCards,
  SessionBarChart,
  CompositionGauge,
  NextSessionCard,
  SessionTracker,
} from "@/components/admin/dashboard-widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToWibDateTime } from "@/lib/csv";
import { Clock, Activity, ArrowRight, QrCode, Monitor, Theater } from "lucide-react";
import Link from "next/link";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="space-y-6">
          <Skeleton className="h-[360px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[200px] rounded-3xl" />
          <Skeleton className="h-[300px] rounded-3xl" />
          <Skeleton className="h-[180px] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

async function DashboardContent() {
  const supabase = createPublicServerClient();

  const [sessRes, guestsRes, attendancesRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, nama, tanggal, hari, is_active")
      .order("id", { ascending: true }),
    supabase.from("profiles").select("id, nama, perwakilan_daerah").not("nama", "is", null),
    supabase
      .from("attendances")
      .select("id, session_id, guest_id, nama, perwakilan_daerah, is_walk_in, checked_in_at")
      .order("checked_in_at", { ascending: false }),
  ]);

  const rawSessions = sessRes.data || [];
  const rawGuests = guestsRes.data || [];
  const rawAttendances = attendancesRes.data || [];

  const sessions = rawSessions.map((s) => ({
    id: s.id,
    nama: s.nama,
    hari: s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3),
  }));

  const sessionNameMap = new Map<number, string>(
    sessions.map((s) => [s.id, s.nama])
  );

  const attendancesCountBySession = rawAttendances.reduce(
    (acc, a) => {
      acc[a.session_id] = (acc[a.session_id] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const totalGuests = rawGuests.length;
  const totalAttendances = rawAttendances.length;
  const registeredCount = rawAttendances.filter((a) => !a.is_walk_in).length;
  const walkInCount = rawAttendances.filter((a) => a.is_walk_in).length;
  const activeSessionsCount = rawSessions.filter((s) => s.is_active !== false).length;

  const activeRaw = rawSessions.find((s) => s.is_active !== false);
  const activeSession = activeRaw
    ? {
        id: activeRaw.id,
        nama: activeRaw.nama,
        hari: activeRaw.hari ?? (activeRaw.id <= 3 ? 1 : activeRaw.id <= 6 ? 2 : 3),
      }
    : null;

  // 6 Aktivitas Presensi Terbaru
  const recentAttendances = rawAttendances.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header halaman ala desain */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-ink-muted">
            Pantau kehadiran peserta secara realtime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/qr"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-green-deep"
          >
            <QrCode className="h-4 w-4" />
            Cetak QR Absen
          </Link>
          <Link
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:border-ring"
          >
            <Monitor className="h-4 w-4 text-brand-green-text" />
            Buka Videotron
          </Link>
          <Link
            href="/display-absen"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:border-ring"
          >
            <Theater className="h-4 w-4 text-brand-green-text" />
            Videotron Aula
          </Link>
        </div>
      </div>

      {/* 4 Kartu statistik */}
      <DashboardStatCards
        totalGuests={totalGuests}
        totalAttendances={totalAttendances}
        walkInCount={walkInCount}
        activeSessionsCount={activeSessionsCount}
        sessionsCount={sessions.length}
      />

      {/* Grid utama: grafik + list (kiri), kartu kanan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <SessionBarChart
            sessions={sessions}
            attendancesCountBySession={attendancesCountBySession}
          />

          {/* Presensi Terkini */}
          <Card className="rounded-3xl border-line bg-white shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-green-text" />
                Presensi Terkini
              </CardTitle>
              <Link
                href="/rekap-kehadiran"
                className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-brand-green-text"
              >
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-1">
              {recentAttendances.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-ink-muted/40" />
                  Belum ada aktivitas presensi yang masuk.
                </div>
              ) : (
                <div className="divide-y divide-line/60">
                  {recentAttendances.map((item) => {
                    const sName =
                      sessionNameMap.get(item.session_id) ||
                      `Sesi ${item.session_id}`;
                    const wib = formatToWibDateTime(item.checked_in_at);
                    const initials = item.nama
                      .split(" ")
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 font-heading text-xs font-bold text-primary">
                            {initials}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-primary">
                                {item.nama}
                              </span>
                              {item.is_walk_in ? (
                                <Badge className="border-gold-300 bg-gold-100 text-[10px] font-semibold text-brand-gold-text">
                                  Tamu Baru
                                </Badge>
                              ) : (
                                <Badge className="border-brand-green/30 bg-green-100 text-[10px] font-semibold text-brand-green-deep">
                                  Terdaftar
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-ink-muted">
                              {item.perwakilan_daerah} &bull;{" "}
                              <span className="font-medium text-primary">
                                {sName}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 font-mono text-[11px] text-ink-muted sm:text-right">
                          {wib}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-6">
          <NextSessionCard activeSession={activeSession} />
          <CompositionGauge
            registeredCount={registeredCount}
            walkInCount={walkInCount}
          />
          <SessionTracker />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
