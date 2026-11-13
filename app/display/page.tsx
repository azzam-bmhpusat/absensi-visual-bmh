import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { DisplayHeader } from "@/components/display/display-header";
import { AttendanceBoard } from "@/components/display/attendance-board";
import { Skeleton } from "@/components/ui/skeleton";
import {
  resolveActiveSession,
  type SessionData,
  type GuestData,
  type AttendanceData,
} from "@/lib/display-helpers";

interface DisplayPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function DisplayLoader({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const querySesi = resolvedParams?.sesi;

  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "Silaturahim & Rapat Kerja Nasional BMH";

  const supabase = createPublicServerClient();

  let sessions: SessionData[] = [
    { id: 1, slug: "hari-1-pagi", nama: "Absen Masuk Pagi", hari: 1 },
    { id: 2, slug: "hari-1-isoma", nama: "Masuk Setelah Isoma", hari: 1 },
    { id: 3, slug: "hari-1-malam", nama: "Masuk Setelah Makan Malam", hari: 1 },
    { id: 4, slug: "hari-2-pagi", nama: "Absen Masuk Pagi", hari: 2 },
    { id: 5, slug: "hari-2-isoma", nama: "Masuk Setelah Isoma", hari: 2 },
    { id: 6, slug: "hari-2-malam", nama: "Masuk Setelah Makan Malam", hari: 2 },
    { id: 7, slug: "hari-3-pagi", nama: "Absen Masuk Pagi", hari: 3 },
    { id: 8, slug: "hari-3-isoma", nama: "Masuk Setelah Isoma", hari: 3 },
    { id: 9, slug: "hari-3-malam", nama: "Masuk Setelah Makan Malam", hari: 3 },
  ];
  let guests: GuestData[] = [];
  let attendances: AttendanceData[] = [];

  try {
    const [sessRes, guestsRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, slug, nama, tanggal, hari, is_active")
        .order("id", { ascending: true }),
      supabase
        .from("guests")
        .select("id, nama, perwakilan_daerah")
        .order("perwakilan_daerah", { ascending: true })
        .order("nama", { ascending: true }),
    ]);

    if (sessRes.data && sessRes.data.length > 0) {
      sessions = sessRes.data;
    }
    if (guestsRes.data && guestsRes.data.length > 0) {
      guests = guestsRes.data;
    }
  } catch (err) {
    console.error("Gagal memuat sesi atau tamu awal:", err);
  }

  // Tentukan sesi aktif (baca ?sesi= -> fallback tanggal WIB -> default sesi 1)
  const activeSession = resolveActiveSession(sessions, querySesi);

  try {
    const { data: rawAttendances } = await supabase
      .from("attendances")
      .select(
        "id, session_id, guest_id, nama, perwakilan_daerah, is_walk_in, checked_in_at"
      )
      .eq("session_id", activeSession.id)
      .order("checked_in_at", { ascending: false });

    if (rawAttendances) {
      attendances = rawAttendances;
    }
  } catch (err) {
    console.error("Gagal memuat absensi sesi aktif:", err);
  }

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0">
      <DisplayHeader
        eventName={eventName}
        sessionName={activeSession.nama}
      />

      <AttendanceBoard
        initialSessions={sessions}
        activeSession={activeSession}
        initialGuests={guests}
        initialAttendances={attendances}
      />
    </div>
  );
}

function DisplaySkeleton() {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-0 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between min-h-[90px] border-b border-border/40 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 bg-white/10" />
          <Skeleton className="h-10 w-96 bg-white/10" />
        </div>
        <div className="space-y-2 text-right flex flex-col items-end">
          <Skeleton className="h-8 w-44 bg-white/10" />
          <Skeleton className="h-5 w-32 bg-white/10" />
        </div>
      </div>

      {/* Counter Skeleton (Ramping) */}
      <div className="space-y-2 py-2">
        <Skeleton className="h-8 w-64 bg-white/10" />
        <Skeleton className="h-2 w-full rounded-full bg-white/10" />
      </div>

      {/* Columns Skeleton */}
      <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
        <Skeleton className="h-full rounded-2xl bg-white/5 border border-white/10" />
        <Skeleton className="h-full rounded-2xl bg-white/5 border border-white/10" />
      </div>

      {/* Footer Skeleton */}
      <div className="h-10 flex items-center justify-between border-t border-border/40 pt-3">
        <Skeleton className="h-5 w-40 bg-white/10" />
        <Skeleton className="h-5 w-60 bg-white/10" />
      </div>
    </div>
  );
}

export default function DisplayPage({ searchParams }: DisplayPageProps) {
  return (
    <main className="display-theme display-bg w-screen h-screen overflow-hidden text-foreground p-6 xl:p-10 flex flex-col justify-between select-none">
      <Suspense fallback={<DisplaySkeleton />}>
        <DisplayLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
