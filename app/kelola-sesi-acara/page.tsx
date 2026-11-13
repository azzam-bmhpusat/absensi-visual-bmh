import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavBar } from "@/components/admin/admin-nav-bar";
import AdminSharedLayout from "@/components/admin/admin-layout-shell";
import {
  SessionManager,
  type AdminSessionItem,
} from "@/components/admin/session-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SesiSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

async function SesiContent() {
  const supabase = createPublicServerClient();

  const [sessRes, attendancesRes, guestsRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, nama, tanggal, hari, is_active")
      .order("id", { ascending: true }),
    supabase.from("attendances").select("id, session_id"),
    supabase.from("guests").select("id"),
  ]);

  const rawSessions = sessRes.data || [];
  const rawAttendances = attendancesRes.data || [];

  const adminSessions: AdminSessionItem[] = rawSessions.map((s) => ({
    id: s.id,
    slug: s.slug,
    nama: s.nama,
    hari: s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3),
    tanggal: s.tanggal,
    is_active: s.is_active !== false,
  }));

  const attendancesCountBySession = rawAttendances.reduce(
    (acc, a) => {
      acc[a.session_id] = (acc[a.session_id] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const totalGuests = (guestsRes.data || []).length;
  const totalAttendances = rawAttendances.length;
  const activeSessionsCount = adminSessions.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <AdminNavBar
        guestsCount={totalGuests}
        attendancesCount={totalAttendances}
        activeSessionsCount={activeSessionsCount}
      />

      <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <SessionManager
            initialSessions={adminSessions}
            attendancesCountBySession={attendancesCountBySession}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function KelolaSesiAcaraPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "Silaturahim & Rapat Kerja Nasional BMH";

  return (
    <AdminSharedLayout>
      <AdminHeader eventName={eventName} />
      <Suspense fallback={<SesiSkeleton />}>
        <SesiContent />
      </Suspense>
    </AdminSharedLayout>
  );
}
