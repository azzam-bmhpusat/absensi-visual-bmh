import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { logoutUser } from "@/app/(site)/login/actions";
import { PublicFooter } from "@/components/rakernas/public-page";
import { buttonVariants } from "@/components/ui/button";

const TITLE = "Khusus Peserta Rakernas 2027";

export const metadata: Metadata = {
  title: TITLE,
  robots: { index: false },
};

/** Tujuan redirect ProfileGate untuk role `user` (akun Google yang belum peserta). */
export default function KhususPesertaPage() {
  return (
    <>
      <main className="flex min-h-svh items-center justify-center bg-background px-5 pt-[calc(72px+env(safe-area-inset-top)+2.5rem)] pb-10">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-brand-gold/40 border-t-4 border-t-brand-gold bg-card p-6 text-center md:p-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-100 ring-4 ring-gold-50">
            <Lock className="size-7 text-brand-gold-text" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-primary md:text-3xl">
            {TITLE}
          </h1>
          <p className="mt-3 text-ink-muted">Masuk dengan akun BMH untuk akses halaman.</p>
          <form action={logoutUser}>
            <button type="submit" className={buttonVariants({ className: "mt-5" })}>
              Masuk dengan Akun BMH
            </button>
          </form>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
