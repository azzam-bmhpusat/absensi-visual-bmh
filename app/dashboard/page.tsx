import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavBar } from "@/components/admin/admin-nav-bar";
import AdminSharedLayout from "@/components/admin/admin-layout-shell";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToWibDateTime } from "@/lib/csv";
import { Clock, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[340px] rounded-3xl" />
        <Skeleton className="h-[340px] rounded-3xl" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const supabase = createPublicServerClient();

  // Ambil data sesi, tamu, dan absensi
  const [sessRes, guestsRes, attendancesRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, nama, tanggal, hari, is_active")
      .order("id", { ascending: true }),
    supabase.from("guests").select("id, nama, perwakilan_daerah"),
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

  // 6 Aktivitas Presensi Terbaru
  const recentAttendances = rawAttendances.slice(0, 6);

  return (
    <div className="space-y-6">
      <AdminNavBar
        guestsCount={totalGuests}
        attendancesCount={totalAttendances}
        activeSessionsCount={activeSessionsCount}
      />

      <DashboardCharts
        sessions={sessions}
        attendancesCountBySession={attendancesCountBySession}
        totalGuests={totalGuests}
        totalAttendances={totalAttendances}
        registeredCount={registeredCount}
        walkInCount={walkInCount}
      />

      {/* Baris Aktivitas Presensi Terbaru */}
      <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-heading text-base font-bold text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-green" />
              Aktivitas Presensi Terkini
            </CardTitle>
            <p className="text-xs text-ink-muted">
              Daftar peserta yang baru saja melakukan absensi di sistem.
            </p>
          </div>
          <Link
            href="/rekap-kehadiran"
            className="text-xs font-semibold text-primary hover:text-brand-green flex items-center gap-1 transition-colors"
          >
            Lihat Semua Rekap
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="pt-1">
          {recentAttendances.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted">
              <Clock className="w-8 h-8 mx-auto mb-2 text-ink-muted/40" />
              Belum ada aktivitas presensi yang masuk.
            </div>
          ) : (
            <div className="divide-y divide-line/60">
              {recentAttendances.map((item) => {
                const sName = sessionNameMap.get(item.session_id) || `Sesi ${item.session_id}`;
                const wib = formatToWibDateTime(item.checked_in_at);

                return (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-sm">
                          {item.nama}
                        </span>
                        {item.is_walk_in ? (
                          <Badge className="bg-gold-100 text-brand-gold-text border-gold-300 text-[10px] font-semibold">
                            Tamu Baru
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-brand-green-deep border-green-300 text-[10px] font-semibold">
                            Terdaftar
                          </Badge>
                        )}
                      </div>
                      <p className="text-ink-muted text-[11px]">
                        {item.perwakilan_daerah} &bull;{" "}
                        <span className="text-primary font-medium">{sName}</span>
                      </p>
                    </div>

                    <div className="text-ink-muted font-mono text-[11px] sm:text-right">
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
  );
}

export default function DashboardPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "Silaturahim & Rapat Kerja Nasional BMH";

  return (
    <AdminSharedLayout>
      <AdminHeader eventName={eventName} />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </AdminSharedLayout>
  );
}
