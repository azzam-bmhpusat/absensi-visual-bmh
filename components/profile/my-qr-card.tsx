"use client";

import { QrCode } from "lucide-react";
import { RoundedQr } from "@/components/admin/rounded-qr";

/** QR absensi pribadi: ditunjukkan ke panitia yang men-scan dengan kamera. */
export function MyQrCard({ token, name }: { token: string; name: string }) {
  return (
    <section
      aria-labelledby="my-qr-title"
      className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-line bg-white p-6 text-center shadow-sm"
    >
      <h2 id="my-qr-title" className="flex items-center gap-2 font-heading text-base font-semibold text-primary">
        <QrCode className="size-5" aria-hidden="true" />
        QR Absensi Saya
      </h2>
      <RoundedQr value={token} level="Q" className="w-56 max-w-full" />
      <p className="wrap-anywhere text-sm font-semibold text-ink">{name}</p>
      <p className="text-xs text-ink-muted">Tunjukkan QR ini ke panitia saat absen. Jangan dibagikan ke orang lain.</p>
    </section>
  );
}
