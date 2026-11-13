import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { SessionPicker, type SessionItem } from "@/components/absen/session-picker";
import type { GuestItem } from "@/components/absen/name-combobox";
import { Skeleton } from "@/components/ui/skeleton";

async function SessionPickerLoader() {
  let sessions: SessionItem[] = [
    { id: 1, slug: "hari-1", nama: "Hari Pertama" },
    { id: 2, slug: "hari-2", nama: "Hari Kedua" },
  ];
  let guests: GuestItem[] = [];
  let daerahList: string[] = [];

  try {
    const supabase = createPublicServerClient();
    const [sessRes, guestsRes] = await Promise.all([
      supabase.from("sessions").select("id, slug, nama, tanggal, is_active").order("id"),
      supabase.from("guests").select("id, nama, perwakilan_daerah").order("nama"),
    ]);

    if (sessRes.data && sessRes.data.length > 0) {
      sessions = sessRes.data;
    }

    if (guestsRes.data && guestsRes.data.length > 0) {
      guests = guestsRes.data;
      const uniqueDaerah = Array.from(
        new Set(guestsRes.data.map((g) => g.perwakilan_daerah.trim()))
      ).filter(Boolean);
      uniqueDaerah.sort((a, b) => a.localeCompare(b, "id"));
      daerahList = uniqueDaerah;
    }
  } catch (err) {
    console.error("Gagal memuat data awal dari Supabase:", err);
  }

  return (
    <SessionPicker
      sessions={sessions}
      guests={guests}
      daerahList={daerahList}
    />
  );
}

function SessionPickerSkeleton() {
  return (
    <div className="space-y-4 text-left">
      <Skeleton className="h-[140px] w-full rounded-3xl" />
      <Skeleton className="h-[140px] w-full rounded-3xl" />
    </div>
  );
}

export default function AbsenPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rakornas BMH";

  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div className="space-y-2">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-primary border border-brand-green/20">
            Sistem Absensi Kehadiran
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            {eventName}
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            Silakan pilih sesi kehadiran di bawah ini untuk mencatat konfirmasi absensi Anda.
          </p>
        </div>

        <Suspense fallback={<SessionPickerSkeleton />}>
          <SessionPickerLoader />
        </Suspense>

        <div className="text-center pt-2">
          <p className="text-xs text-ink-muted/80">
            Baitul Maal Hidayatullah &bull; Kehadiran Realtime
          </p>
        </div>
      </div>
    </main>
  );
}
