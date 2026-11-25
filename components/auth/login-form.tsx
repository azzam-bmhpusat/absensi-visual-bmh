"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Info, Loader2, LogIn } from "lucide-react";
import { loginUser, type LoginResult } from "@/app/(site)/login/actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

const GOOGLE_ERRORS = {
  failed: "Login dengan Google gagal atau dibatalkan. Silakan coba lagi.",
  disabled: "Login dengan Google belum diaktifkan. Silakan masuk dengan email dan kata sandi.",
} as const;

const PREFILL_KEY = "login-prefill-password";

/** Dipanggil setelah kirim /form: kata sandi awal diisikan otomatis di halaman login (sekali pakai, tidak lewat URL). */
export function savePrefillPassword(password: string) {
  try {
    sessionStorage.setItem(PREFILL_KEY, password);
  } catch {}
}

/** Keterangan akun BMH, dipakai semua form login (peserta dan admin). */
export function BmhAccountNote() {
  return (
    <p className="flex items-start gap-2.5 rounded-xl border border-line bg-secondary p-3.5 text-xs leading-relaxed text-ink">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>
        Login dengan akun <span className="font-semibold text-primary">@bmh.or.id</span> untuk mendapatkan semua akses
        Informasi penting
      </span>
    </p>
  );
}

export type GoogleLoginError = keyof typeof GOOGLE_ERRORS;

export function LoginForm({
  next,
  defaultEmail,
  googleError,
}: {
  next?: string;
  defaultEmail?: string;
  /** Dari ?error=google (gagal/dibatalkan) atau ?error=google_disabled (provider belum aktif). */
  googleError?: GoogleLoginError;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<LoginResult | null, FormData>(loginUser, null);
  // Error login email/kata sandi menggantikan pesan error Google.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PREFILL_KEY);
      const input = document.getElementById("password");
      if (saved && input instanceof HTMLInputElement) {
        sessionStorage.removeItem(PREFILL_KEY);
        input.value = saved;
      }
    } catch {}
  }, []);
  const error = state?.error ?? (googleError ? GOOGLE_ERRORS[googleError] : undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("Login berhasil!");
      router.push(state.next ?? "/profile");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-4">
      <BmhAccountNote />
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-relaxed text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <GoogleLoginButton next={next} />

      <div className="flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        atau dengan email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-primary">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={defaultEmail}
            placeholder="nama@bmh.or.id"
            className="h-11 rounded-xl border-line"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-primary">
            Kata Sandi
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            autoFocus={!!defaultEmail}
            placeholder="••••••••"
            className="h-11 rounded-xl border-line"
            disabled={isPending}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-xl bg-primary font-medium text-white shadow-sm hover:bg-brand-green-deep"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4 text-brand-gold-soft" />
              Masuk
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs leading-relaxed text-ink-muted">
        Dengan masuk, Anda menyetujui{" "}
        <Link href="/kebijakan-privasi" className="font-medium text-primary underline underline-offset-4">
          Kebijakan Privasi
        </Link>
        .
      </p>
    </div>
  );
}
