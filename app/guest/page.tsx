import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavBar } from "@/components/admin/admin-nav-bar";
import AdminSharedLayout from "@/components/admin/admin-layout-shell";
import { GuestTable, type GuestItem } from "@/components/admin/guest-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function GuestSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

async function GuestContent() {
  const supabase = createPublicServerClient();

  const [guestsRes, attendancesRes, sessionsRes] = await Promise.all([
    supabase
      .from("guests")
      .select("id, nama, perwakilan_daerah, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("attendances").select("id"),
    supabase.from("sessions").select("id, is_active"),
  ]);

  const rawGuests = guestsRes.data || [];
  const guests: GuestItem[] = rawGuests.map((g) => ({
    id: g.id,
    nama: g.nama,
    perwakilan_daerah: g.perwakilan_daerah,
    created_at: g.created_at,
  }));

  const totalGuests = guests.length;
  const totalAttendances = (attendancesRes.data || []).length;
  const activeSessionsCount = (sessionsRes.data || []).filter(
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
          <GuestTable initialGuests={guests} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function GuestPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "Silaturahim & Rapat Kerja Nasional BMH";

  return (
    <AdminSharedLayout>
      <AdminHeader eventName={eventName} />
      <Suspense fallback={<GuestSkeleton />}>
        <GuestContent />
      </Suspense>
    </AdminSharedLayout>
  );
}
