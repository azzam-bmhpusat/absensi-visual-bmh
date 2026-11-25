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

/** Dialog wajib (tidak bisa ditutup) untuk peserta yang profilnya belum lengkap; tombolnya menuju /profile. */
export function CompleteProfileDialog() {
  return (
    <Dialog open onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Lengkapi Profil Anda</DialogTitle>
          <DialogDescription>
            Halaman ini hanya dapat diakses setelah seluruh data profil terisi. Silakan lengkapi form profil terlebih
            dahulu.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Link href="/profile" className={buttonVariants()}>
            Lengkapi Profil
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
