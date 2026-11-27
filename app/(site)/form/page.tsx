import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantPassword } from "@/lib/participant-account";
import { PROFILE_COMPLETE_COLUMNS, isProfileComplete } from "@/lib/profile-contact";
import { PublicFooter } from "@/components/rakernas/public-page";
import { ParticipantForm, type ParticipantOption } from "@/components/form/participant-form";

export const metadata: Metadata = {
  title: "Formulir Data Peserta",
  robots: { index: false, follow: false },
};

async function FormContent() {
  await connection();
  // Kolom privat hanya dipakai di server untuk menandai profil lengkap; ke browser hanya dikirim id, nama, daerah, dan status.
  const { data } = await createAdminClient()
    .from("profiles")
    .select(`id, ${PROFILE_COMPLETE_COLUMNS}`)
    .eq("role", "peserta")
    .not("nama", "is", null)
    .order("nama", { ascending: true });
  const participants: ParticipantOption[] = (data ?? []).map((p) => ({
    id: p.id,
    nama: p.nama,
    perwakilan_daerah: p.perwakilan_daerah,
    complete: isProfileComplete(p),
  }));

  return <ParticipantForm participants={participants} loginPassword={getParticipantPassword()} role="peserta" />;
}

export default function FormPage() {
  return (
    <>
      <main className="page-bg flex-1 py-8 md:py-12">
        <div className="site-container">
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
        </div>
      </main>
      <Suspense fallback={null}>
        <PublicFooter showNav={false} />
      </Suspense>
    </>
  );
}
