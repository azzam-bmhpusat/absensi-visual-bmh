import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavBar } from "@/components/admin/admin-nav-bar";
import AdminSharedLayout from "@/components/admin/admin-layout-shell";
import {
  AttendanceRekapTable,
  type AttendanceItem,
} from "@/components/admin/attendance-rekap-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function RekapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

async function RekapContent() {
  const supabase = createPublicServerClient();

  const [sessRes, attendancesRes, guestsRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, nama, tanggal, hari, is_active")
      .order("id", { ascending: true }),
    supabase
      .from("attendances")
      .select(
        "id, session_id, guest_id, nama, perwakilan_daerah, is_walk_in, checked_in_at"
      )
      .order("checked_in_at", { ascending: false }),
    supabase.from("guests").select("id"),
  ]);

  const rawSessions = sessRes.data || [];
  const rawAttendances = attendancesRes.data || [];

  const sessions = rawSessions.map((s) => ({
    id: s.id,
    nama: s.nama,
    hari: s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3),
  }));

  const attendances: AttendanceItem[] = rawAttendances.map((a) => ({
    id: a.id,
    session_id: a.session_id,
    guest_id: a.guest_id,
    nama: a.nama,
    perwakilan_daerah: a.perwakilan_daerah,
    is_walk_in: a.is_walk_in,
    checked_in_at: a.checked_in_at,
  }));

  const totalGuests = (guestsRes.data || []).length;
  const totalAttendances = attendances.length;
  const activeSessionsCount = rawSessions.filter(
    (s) => s.is_active !== false
  ).length;

  return (
    <div className="space-y-6">
      <AdminNavBar
        guestsCount={totalGuests}
        attendancesCount={totalAttendances}
        activeSessionsCount={activeSessionsCount}
      />

      <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <AttendanceRekapTable
            attendances={attendances}
            sessions={sessions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function RekapKehadiranPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "Silaturahim & Rapat Kerja Nasional BMH";

  return (
    <AdminSharedLayout>
      <AdminHeader eventName={eventName} />
      <Suspense fallback={<RekapSkeleton />}>
        <RekapContent />
      </Suspense>
    </AdminSharedLayout>
  );
}
