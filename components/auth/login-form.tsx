"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { loginUser, type LoginResult } from "@/app/(site)/login/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm({ next, defaultEmail }: { next?: string; defaultEmail?: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<LoginResult | null, FormData>(loginUser, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Login berhasil!");
      router.push(state.next ?? "/profile");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-relaxed text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

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
        <Input
          id="password"
          name="password"
          type="password"
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
  );
}
