import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LiveQr } from "@/components/admin/live-qr";

export const metadata: Metadata = {
  title: "QR Presensi Dinamis",
  robots: { index: false, follow: false },
};

export default function AdminLiveQrPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Kerja Nasional BMH 2026";

  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 gap-4">
      <Link
        href="/admin/qr"
        className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-primary py-1.5 px-2.5 rounded-xl bg-white border border-line shadow-2xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Panel QR
      </Link>
      <LiveQr eventName={eventName} />
    </main>
  );
}
