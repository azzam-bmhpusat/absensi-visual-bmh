"use client";

import { useActionState } from "react";
import { BmhAccountNote } from "@/components/auth/login-form";
import { loginAdmin, type ActionResult } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AdminLoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    loginAdmin,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Login berhasil! Mengalihkan ke panel admin...");
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <BmhAccountNote />
      {state?.error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-danger text-xs leading-relaxed animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold text-primary">
          Email Panitia
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@bmh.or.id"
          className="h-11 rounded-xl border-line focus-visible:ring-ring"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-semibold text-primary">
            Kata Sandi
          </Label>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="h-11 rounded-xl border-line focus-visible:ring-ring"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-xl bg-primary hover:bg-brand-green-deep text-white font-medium transition-all shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
            Memverifikasi...
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 mr-2 text-brand-gold-soft" />
            Masuk ke Panel Admin
          </>
        )}
      </Button>
    </form>
  );
}
