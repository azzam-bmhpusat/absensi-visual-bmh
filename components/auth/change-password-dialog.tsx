"use client";

import { useActionState, useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Loader2, LogOut } from "lucide-react";
import { cn } from "cn";
import { changePassword, type ChangePasswordResult } from "@/app/(site)/password/actions";
import { logoutUser } from "@/app/(site)/login/actions";
import { NEW_PASSWORD_MIN } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function PasswordInput({
  name,
  label,
  autoComplete,
  value,
  onChange,
  invalid,
  disabled,
  describedBy,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-primary">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          required
          maxLength={72}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className="h-11 rounded-xl border-line pr-11"
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-ink-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

/**
 * Dialog wajib (tidak bisa ditutup) setelah peserta login dengan kata sandi awal.
 * Satu-satunya jalan keluar selain mengganti kata sandi adalah tombol Keluar.
 */
export function ChangePasswordDialog() {
  const router = useRouter();
  const rulesId = useId();
  const [state, formAction, isPending] = useActionState<ChangePasswordResult | null, FormData>(changePassword, null);
  const [loggingOut, startLogout] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success("Kata sandi berhasil diganti.");
      router.refresh();
    }
  }, [state, router]);

  const busy = isPending || loggingOut || state?.success === true;
  const confirmMismatch = confirm.length > 0 && confirm !== next;
  const lengthOk = next.length >= NEW_PASSWORD_MIN;

  return (
    <Dialog open onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-brand-green-deep text-white">
            <KeyRound className="size-6" aria-hidden />
          </span>
          <DialogTitle className="font-heading text-lg font-semibold text-primary">Buat Kata Sandi Baru</DialogTitle>
          <DialogDescription className="text-balance">
            Demi keamanan akun, ganti kata sandi awal Anda sebelum membuka profil dan halaman peserta.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{state.error}</span>
            </div>
          )}

          <PasswordInput
            name="current"
            label="Kata sandi saat ini"
            autoComplete="current-password"
            value={current}
            onChange={setCurrent}
            invalid={state?.field === "current"}
            disabled={busy}
          />
          <PasswordInput
            name="next"
            label="Kata sandi baru"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
            invalid={state?.field === "next"}
            disabled={busy}
            describedBy={rulesId}
          />
          <p
            id={rulesId}
            className={cn(
              "-mt-1 flex items-center gap-1.5 text-xs",
              lengthOk ? "text-brand-green-text" : "text-ink-muted"
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full border",
                lengthOk ? "border-transparent bg-brand-green-deep text-white" : "border-line"
              )}
            >
              {lengthOk && <Check className="size-3" aria-hidden />}
            </span>
            Minimal {NEW_PASSWORD_MIN} karakter
            <span className="sr-only">{lengthOk ? "(terpenuhi)" : "(belum)"}</span>
          </p>
          <div className="space-y-1">
            <PasswordInput
              name="confirm"
              label="Ulangi kata sandi baru"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
              invalid={confirmMismatch || state?.field === "confirm"}
              disabled={busy}
            />
            {confirmMismatch && <p className="text-xs text-danger">Konfirmasi kata sandi belum sama.</p>}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl text-ink-muted"
              disabled={busy}
              onClick={() => startLogout(() => logoutUser())}
            >
              {loggingOut ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
              Keluar
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="h-11 rounded-xl bg-brand-green-deep px-5 font-semibold text-white hover:bg-brand-green-deep/90"
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Simpan Kata Sandi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
