import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/rakernas/public-page";
import { buttonVariants } from "@/components/ui/button";

const TITLE = "Khusus Peserta Rakernas 2027";

export const metadata: Metadata = {
  title: TITLE,
  robots: { index: false },
};

/** Tujuan redirect ProfileGate untuk role `user` (akun Google baru yang belum peserta). */
export default function KhususPesertaPage() {
  return (
    <PublicPage title={TITLE}>
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="text-ink-muted">
          Halaman ini hanya dapat diakses oleh peserta. Silakan ajukan diri Anda sebagai peserta di halaman profil.
        </p>
        <Link href="/profile" className={buttonVariants({ className: "mt-5" })}>
          Ajukan di Halaman Profil
        </Link>
      </div>
    </PublicPage>
  );
}
