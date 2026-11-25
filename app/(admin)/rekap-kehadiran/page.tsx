import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
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

  const [sessRes, attendancesRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, nama, tanggal, hari, is_active")
      .order("id", { ascending: true }),
    supabase
      .from("attendances")
      .select(
        "id, session_id, guest_id, nama, perwakilan_daerah, jabatan, kategori, is_walk_in, checked_in_at"
      )
      .order("checked_in_at", { ascending: false }),
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
    jabatan: a.jabatan,
    kategori: a.kategori,
    is_walk_in: a.is_walk_in,
    checked_in_at: a.checked_in_at,
  }));

  return (
    <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <AttendanceRekapTable attendances={attendances} sessions={sessions} />
      </CardContent>
    </Card>
  );
}

export default function RekapKehadiranPage() {
  return (
    <Suspense fallback={<RekapSkeleton />}>
      <RekapContent />
    </Suspense>
  );
}