import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { GuestTable, type GuestItem } from "@/components/admin/guest-table";
import {
  AttendanceRekapTable,
  type AttendanceItem,
} from "@/components/admin/attendance-rekap-table";
import {
  SessionManager,
  type AdminSessionItem,
} from "@/components/admin/session-manager";
import { Users, ClipboardList, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function AdminSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-80 rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

async function AdminContent() {
  const supabase = createPublicServerClient();

  // Ambil data sesi
  const { data: rawSessions } = await supabase
    .from("sessions")
    .select("id, slug, nama, tanggal, is_active")
    .order("id", { ascending: true });

  const sessions = (rawSessions || []).map((s) => ({
    id: s.id,
    nama: s.nama,
  }));

  const adminSessions: AdminSessionItem[] = (rawSessions || []).map((s) => ({
    id: s.id,
    slug: s.slug,
    nama: s.nama,
    tanggal: s.tanggal,
    is_active: s.is_active !== false,
  }));

  // Ambil daftar tamu undangan
  const { data: rawGuests } = await supabase
    .from("guests")
    .select("id, nama, perwakilan_daerah, created_at")
    .order("created_at", { ascending: false });

  const guests: GuestItem[] = (rawGuests || []).map((g) => ({
    id: g.id,
    nama: g.nama,
    perwakilan_daerah: g.perwakilan_daerah,
    created_at: g.created_at,
  }));

  // Ambil data kehadiran presensi
  const { data: rawAttendances } = await supabase
    .from("attendances")
    .select(
      "id, session_id, guest_id, nama, perwakilan_daerah, is_walk_in, checked_in_at"
    )
    .order("checked_in_at", { ascending: false });

  const attendances: AttendanceItem[] = (rawAttendances || []).map((a) => ({
    id: a.id,
    session_id: a.session_id,
    guest_id: a.guest_id,
    nama: a.nama,
    perwakilan_daerah: a.perwakilan_daerah,
    is_walk_in: a.is_walk_in,
    checked_in_at: a.checked_in_at,
  }));

  // Hitung jumlah kehadiran per sesi
  const attendancesCountBySession = (rawAttendances || []).reduce(
    (acc, a) => {
      acc[a.session_id] = (acc[a.session_id] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const activeSessionsCount = adminSessions.filter((s) => s.is_active).length;

  return (
    <Tabs defaultValue="tamu" className="space-y-4">
      <TabsList className="bg-muted p-1 rounded-2xl h-11 border border-line flex flex-wrap max-w-full">
        <TabsTrigger
          value="tamu"
          className="rounded-xl px-4 sm:px-5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-2xs transition-all flex items-center gap-2"
        >
          <Users className="w-3.5 h-3.5 text-brand-green" />
          Daftar Tamu Undangan
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-secondary text-primary font-bold">
            {guests.length}
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="rekap"
          className="rounded-xl px-4 sm:px-5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-2xs transition-all flex items-center gap-2"
        >
          <ClipboardList className="w-3.5 h-3.5 text-brand-gold-text" />
          Rekap Kehadiran
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-gold-100 text-brand-gold-text font-bold">
            {attendances.length}
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="sesi"
          className="rounded-xl px-4 sm:px-5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-2xs transition-all flex items-center gap-2"
        >
          <CalendarClock className="w-3.5 h-3.5 text-primary" />
          Kelola Sesi Acara
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-green-100 text-brand-green-deep font-bold">
            {activeSessionsCount} Aktif
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tamu" className="mt-0 space-y-4">
        <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <GuestTable initialGuests={guests} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rekap" className="mt-0 space-y-4">
        <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <AttendanceRekapTable
              attendances={attendances}
              sessions={sessions}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sesi" className="mt-0 space-y-4">
        <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <SessionManager
              initialSessions={adminSessions}
              attendancesCountBySession={attendancesCountBySession}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default function AdminPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "Silaturahim & Rapat Koordinasi Nasional BMH";

  return (
    <div className="space-y-6">
      <AdminHeader eventName={eventName} />
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </div>
  );
}
