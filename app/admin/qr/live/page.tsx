import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveBoard } from "@/components/admin/live/live-board";
import "@/components/iso/iso.css";
import "@/components/admin/live/live-board.css";

export const metadata: Metadata = {
  title: "QR Presensi Dinamis",
  robots: { index: false, follow: false },
};

export default function AdminLiveQrPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Kerja Nasional BMH 2027";

  return (
    <Suspense fallback={<main className="page-bg h-dvh" />}>
      <LiveBoard eventName={eventName} />
    </Suspense>
  );
}
