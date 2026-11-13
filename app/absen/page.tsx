import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { SessionPicker, type SessionItem } from "@/components/absen/session-picker";
import type { GuestItem } from "@/components/absen/name-combobox";
import { Skeleton } from "@/components/ui/skeleton";

async function SessionPickerLoader() {
  let sessions: SessionItem[] = [
    { id: 1, slug: "hari-1-pagi", nama: "Absen Masuk Pagi", hari: 1, is_active: true },
    { id: 2, slug: "hari-1-isoma", nama: "Masuk Setelah Isoma", hari: 1, is_active: true },
    { id: 3, slug: "hari-1-malam", nama: "Masuk Setelah Makan Malam", hari: 1, is_active: true },
    { id: 4, slug: "hari-2-pagi", nama: "Absen Masuk Pagi", hari: 2, is_active: true },
    { id: 5, slug: "hari-2-isoma", nama: "Masuk Setelah Isoma", hari: 2, is_active: true },
    { id: 6, slug: "hari-2-malam", nama: "Masuk Setelah Makan Malam", hari: 2, is_active: true },
    { id: 7, slug: "hari-3-pagi", nama: "Absen Masuk Pagi", hari: 3, is_active: true },
    { id: 8, slug: "hari-3-isoma", nama: "Masuk Setelah Isoma", hari: 3, is_active: true },
    { id: 9, slug: "hari-3-malam", nama: "Masuk Setelah Makan Malam", hari: 3, is_active: true },
  ];
  let guests: GuestItem[] = [];
  let daerahList: string[] = [];

  try {
    const supabase = createPublicServerClient();
    const [sessRes, guestsRes] = await Promise.all([
      supabase.from("sessions").select("id, slug, nama, tanggal, hari, is_active").order("id"),
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
    <div className="space-y-3 sm:space-y-4 text-left w-full">
      <Skeleton className="h-[96px] sm:h-[108px] w-full rounded-2xl sm:rounded-3xl" />
      <Skeleton className="h-[96px] sm:h-[108px] w-full rounded-2xl sm:rounded-3xl" />
      <Skeleton className="h-[96px] sm:h-[108px] w-full rounded-2xl sm:rounded-3xl" />
    </div>
  );
}

export default function AbsenPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Kerja Nasional BMH";

  return (
    <main className="page-bg min-h-screen flex flex-col justify-between p-4 sm:p-6 pb-8">
      <div className="w-full max-w-md mx-auto text-center space-y-5 my-auto py-2">
        {/* Header Acara (Mobile First) */}
        <div className="space-y-2">
          <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-secondary text-primary border border-brand-green/20">
            Sistem Presensi Kehadiran
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-primary tracking-tight leading-snug">
            {eventName}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
            Silakan pilih sesi kehadiran di bawah ini untuk mencatat konfirmasi absensi Anda.
          </p>
        </div>

        {/* Daftar Sesi Pilihan */}
        <Suspense fallback={<SessionPickerSkeleton />}>
          <SessionPickerLoader />
        </Suspense>

        {/* Footer Identitas BMH */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-ink-muted/80">
            Baitul Maal Hidayatullah &bull; Kehadiran Realtime
          </p>
        </div>
      </div>
    </main>
  );
}
