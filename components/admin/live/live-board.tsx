"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LiveQr } from "@/components/admin/live-qr";
import { ScanPhoneFigure } from "@/components/figures/scan-phone/scan-phone-figure";
import { TicketPrinterFigure } from "@/components/figures/ticket-printer/ticket-printer-figure";
import { openLabel } from "@/lib/live-attendance-model";
import { useLiveAttendance } from "./use-live-attendance";

const STATUS_TEXT = {
  connecting: "Menghubungkan…",
  live: "Realtime",
  reconnecting: "Menyambung ulang…",
} as const;

/**
 * Layar QR presensi: QR di tengah, figur Anatomy realtime di kiri & kanan, pas 1 layar.
 * Satu warna latar (#FBFBFA); pemisah hanya garis tipis dan garis titik-titik.
 */
export function LiveBoard({ eventName }: { eventName: string }) {
  const sesi = useSearchParams().get("sesi");
  const { status, ready, ...snapshot } = useLiveAttendance(sesi);
  const sessionText = ready ? openLabel(snapshot.sessions) : "Memuat sesi…";
  const isOpen = snapshot.sessions.length > 0;

  return (
    <main className="qr-live iso h-dvh overflow-hidden flex flex-col" data-theme="light">
      <header className="qr-live-header shrink-0 flex items-center justify-between gap-4 mx-4 lg:mx-6 py-3">
        <Link href="/admin/qr" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-primary">
          <ArrowLeft className="w-3.5 h-3.5" />
          Panel QR
        </Link>
        <p className="hidden md:block font-heading text-sm lg:text-base font-bold text-primary truncate">{eventName}</p>
        <p className="flex items-center gap-2 text-[11px] font-medium text-ink-muted min-w-0">
          <span
            className={`w-1.5 h-1.5 shrink-0 rounded-full ${status === "live" && isOpen ? "bg-brand-green animate-pulse" : "bg-brand-gold"}`}
            aria-hidden="true"
          />
          <span className="font-semibold text-primary truncate">{sessionText}</span>
          <span className="hidden sm:inline shrink-0">· {STATUS_TEXT[status]}</span>
        </p>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch px-4 lg:px-6 pb-4">
        <section className="qr-live-fig qr-live-col-left hidden lg:flex h-full min-h-0" aria-label="Data absensi realtime: pemindai">
          <ScanPhoneFigure {...snapshot} />
        </section>

        <section className="flex items-center justify-center min-h-0 px-4 xl:px-8">
          <LiveQr />
        </section>

        <section className="qr-live-fig qr-live-col-right hidden lg:flex h-full min-h-0" aria-label="Data absensi realtime: tiket kedatangan">
          <TicketPrinterFigure {...snapshot} />
        </section>
      </div>
    </main>
  );
}
