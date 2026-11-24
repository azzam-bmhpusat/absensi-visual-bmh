import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FORM_ACCESS_COOKIE, verifyFormAccessToken } from "@/lib/form-access";
import { getParticipantPassword } from "@/lib/participant-account";
import { PublicFooter } from "@/components/rakernas/public-page";
import { FormAccessDialog } from "@/components/form/access-dialog";
import { ParticipantForm, type ParticipantOption } from "@/components/form/participant-form";

export const metadata: Metadata = {
  title: "Formulir Data Peserta",
  robots: { index: false, follow: false },
};

async function FormContent() {
  await connection();
  const access = verifyFormAccessToken((await cookies()).get(FORM_ACCESS_COOKIE)?.value);
  if (!access) return <FormAccessDialog />;

  // Daftar peserta hanya dimuat setelah kata sandi akses benar.
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, nama, perwakilan_daerah")
    .eq("role", "peserta")
    .not("nama", "is", null)
    .order("nama", { ascending: true });
  const participants: ParticipantOption[] = (data ?? []).map((p) => ({
    id: p.id,
    nama: p.nama,
    perwakilan_daerah: p.perwakilan_daerah,
  }));

  return <ParticipantForm participants={participants} loginPassword={getParticipantPassword()} />;
}

export default function FormPage() {
  return (
    <>
      <main className="page-bg flex-1 px-4 py-8 sm:px-6 md:py-12">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <header className="text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-brand-gold-text uppercase">Rakernas BMH</p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-primary sm:text-3xl">Formulir Data Peserta</h1>
            <p className="mt-2 text-sm text-ink-muted sm:text-base">
              Pilih nama Anda, lengkapi seluruh data, lalu kirim.
            </p>
          </header>
          <Suspense fallback={null}>
            <FormContent />
          </Suspense>
        </div>
      </main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </>
  );
}
