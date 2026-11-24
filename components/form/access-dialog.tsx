"use client";

import { useActionState, useState } from "react";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { unlockForm, type UnlockResult } from "@/app/(site)/form/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

/**
 * Dialog wajib (tidak bisa ditutup) berisi satu kolom kata sandi akses.
 * Browser tidak bisa menyalakan Caps Lock, jadi efeknya ditiru: keyboard HP dibuka dalam huruf besar
 * (autoCapitalize) dan setiap ketikan diubah ke huruf besar.
 */
export function FormAccessDialog() {
  const [state, formAction, isPending] = useActionState<UnlockResult | null, FormData>(unlockForm, null);
  const [value, setValue] = useState("");

  return (
    <Dialog open onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <DialogTitle className="font-heading text-lg font-bold text-primary">Formulir Data Peserta</DialogTitle>
          <DialogDescription>Masukkan kata sandi akses dari panitia untuk membuka formulir.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="form-access-password" className="text-xs font-semibold text-primary">
              Kata Sandi Akses
            </Label>
            {/* Tampil sejak awal: kolom password mengabaikan autoCapitalize sehingga keyboard HP tidak huruf besar */}
            <PasswordInput
              id="form-access-password"
              name="password"
              defaultVisible
              required
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              aria-invalid={state?.error ? true : undefined}
              aria-describedby={state?.error ? "form-access-error" : undefined}
              className="h-12 rounded-xl border-line pl-11 text-center font-semibold tracking-[0.2em] uppercase"
              disabled={isPending}
            />
          </div>
          {state?.error && (
            <p id="form-access-error" role="alert" className="flex items-center gap-2 text-sm text-danger">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              {state.error}
            </p>
          )}
          <Button
            type="submit"
            disabled={isPending || !value.trim()}
            className="h-12 w-full rounded-xl bg-primary font-semibold text-white hover:bg-brand-green-deep"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {isPending ? "Memeriksa..." : "Buka Formulir"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
