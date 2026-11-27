"use client";

import { ChevronDown, QrCode } from "lucide-react";
import { RoundedQr } from "@/components/admin/rounded-qr";

/** QR absensi pribadi: ditunjukkan ke panitia yang men-scan dengan kamera. */
export function MyQrCard({ token }: { token: string }) {
  return (
    <details className="group rounded-2xl border border-white/15 bg-white/8">
      <summary className="flex min-h-[46px] cursor-pointer list-none items-center gap-2.5 rounded-2xl px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold [&::-webkit-details-marker]:hidden">
        <QrCode className="size-[18px] text-brand-gold" aria-hidden="true" />
        QR Code Absensi
        <ChevronDown className="ml-auto size-4 text-white/80 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col items-center gap-3.5 px-4 pt-0.5 pb-3 text-center">
        <RoundedQr value={token} level="Q" className="block w-40 max-w-full rounded-xl bg-white" />
        <p className="text-xs leading-relaxed text-white/80">Tunjukkan QR ini kepada panitia untuk absen.</p>
      </div>
    </details>
  );
}
