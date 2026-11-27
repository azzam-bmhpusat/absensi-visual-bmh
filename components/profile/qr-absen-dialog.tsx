"use client";

import type { ReactElement } from "react";
import { RoundedQr } from "@/components/admin/rounded-qr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * QR absensi pribadi dalam dialog: QR besar di atas latar putih agar mudah di-scan panitia.
 * @param trigger Elemen pemicu (tombol) yang membuka dialog.
 */
export function QrAbsenDialog({ token, trigger }: { token: string; trigger: ReactElement }) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-[min(92vw,380px)] gap-4 rounded-3xl p-5 sm:p-6">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="font-heading text-xl font-bold text-primary">QR Code Absensi</DialogTitle>
          <DialogDescription>Tunjukkan QR ini kepada panitia untuk absen.</DialogDescription>
        </DialogHeader>
        <div className="mx-auto w-full max-w-[320px] rounded-2xl bg-white p-3 ring-1 ring-line">
          <RoundedQr value={token} level="Q" className="block w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
