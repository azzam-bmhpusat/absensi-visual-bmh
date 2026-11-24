"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";

const COPY = {
  /** Peserta yang profilnya belum lengkap. */
  complete: {
    title: "Lengkapi Profil Anda",
    description:
      "Halaman ini hanya dapat diakses setelah seluruh data profil terisi. Silakan lengkapi form profil terlebih dahulu.",
    action: "Lengkapi Profil",
  },
  /** Role `user` (akun Google baru): belum peserta. */
  apply: {
    title: "Khusus Peserta Rakernas 2027",
    description:
      "Halaman ini hanya dapat diakses oleh peserta. Silakan ajukan diri Anda sebagai peserta di halaman profil.",
    action: "Ajukan di Halaman Profil",
  },
} as const;

/** Dialog wajib (tidak bisa ditutup) di halaman khusus peserta; tombolnya menuju /profile. */
export function CompleteProfileDialog({ variant = "complete" }: { variant?: keyof typeof COPY }) {
  const copy = COPY[variant];
  return (
    <Dialog open onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Link href="/profile" className={buttonVariants()}>
            {copy.action}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
