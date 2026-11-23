import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { QrCode } from "lucide-react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { TICKET_COOKIE, verifyTicket } from "@/lib/absen-token";
import { SessionPicker, type SessionItem } from "@/components/absen/session-picker";
import type { GuestItem } from "@/components/absen/name-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

type ScanGateReason = "missing" | "expired-qr" | "used";

/** Tiket valid dan belum pernah dipakai untuk absen? */
async function getScanGate(
  searchParams: Promise<{ e?: string | string[] }>
): Promise<ScanGateReason | null> {
  // Tandai render per-request sebelum memakai waktu sekarang (verifikasi masa berlaku tiket)
  await connection();
  const [cookieStore, params] = await Promise.all([cookies(), searchParams]);
  const ticket = verifyTicket(cookieStore.get(TICKET_COOKIE)?.value);
  if (!ticket) return params.e === "qr" ? "expired-qr" : "missing";

  try {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("attendances")
      .select("id")
      .eq("ticket_nonce", ticket.nonce)
      .limit(1);
    if (data && data.length > 0) return "used";
  } catch (err) {
    // Server action tetap menolak tiket yang sudah dipakai lewat unique index.
    console.error("Gagal memeriksa status tiket absen:", err);
  }
  return null;
}

const SCAN_GATE_TEXT: Record<ScanGateReason, { title: string; body: string }> = {
  missing: {
    title: "Scan QR di Lokasi Acara",
    body: "Absensi hanya bisa dilakukan dengan memindai QR yang tampil di layar lokasi acara menggunakan HP Anda sendiri.",
  },
  "expired-qr": {
    title: "QR Sudah Kedaluwarsa",
    body: "QR presensi berganti setiap 30 detik. Silakan pindai ulang QR yang sedang tampil di layar lokasi acara.",
  },
  used: {
    title: "QR Sudah Dipakai",
    body: "Satu kali scan hanya untuk satu kali absen. Jika ingin absen di sesi lain, pindai ulang QR di layar lokasi acara.",
  },
};

function ScanGate({ reason }: { reason: ScanGateReason }) {
  const text = SCAN_GATE_TEXT[reason];
  return (
    <Reveal immediate className="w-full bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-line shadow-sm space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-gold-50 flex items-center justify-center border border-brand-gold-soft">
        <QrCode className="w-8 h-8 text-brand-gold-text" />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-bold text-primary">{text.title}</h2>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{text.body}</p>
      </div>
    </Reveal>
  );
}

async function SessionPickerLoader({
  searchParams,
}: {
  searchParams: Promise<{ e?: string | string[] }>;
}) {
  const gate = await getScanGate(searchParams);
  if (gate) return <ScanGate reason={gate} />;

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
      supabase.from("profiles").select("id, nama, perwakilan_daerah, jabatan, departemen, kategori").not("nama", "is", null).order("nama"),
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

export default function AbsenPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string | string[] }>;
}) {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Kerja Nasional BMH 2027";

  return (
    <main className="page-bg min-h-screen flex flex-col justify-between p-4 sm:p-6 pb-8">
      <div className="w-full max-w-md mx-auto text-center space-y-5 my-auto py-2">
        {/* Header Acara (Mobile First) */}
        <RevealStagger immediate stagger={0.08} className="space-y-2">
          <RevealItem><span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-primary border border-brand-green/20">
            Sistem Presensi Kehadiran
          </span></RevealItem>
          <RevealItem><h1 className="font-heading text-xl sm:text-2xl font-bold text-primary tracking-tight leading-snug">
            {eventName}
          </h1></RevealItem>
          <RevealItem><p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
            Silakan pilih sesi kehadiran di bawah ini untuk mencatat konfirmasi absensi Anda.
          </p></RevealItem>
        </RevealStagger>

        {/* Daftar Sesi Pilihan */}
        <Suspense fallback={<SessionPickerSkeleton />}>
          <SessionPickerLoader searchParams={searchParams} />
        </Suspense>

        {/* Footer Identitas BMH */}
        <Reveal immediate delay={0.4} y={8} className="text-center pt-2">
          <p className="text-xs text-ink-muted">
            Baitul Maal Hidayatullah &bull; Kehadiran Realtime
          </p>
        </Reveal>
      </div>
    </main>
  );
}
