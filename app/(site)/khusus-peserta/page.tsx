import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { PublicFooter } from "@/components/rakernas/public-page";
import { ParticipantAccessCard } from "@/components/auth/participant-access-card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEventSettings } from "@/lib/event-settings-server";

export const instant = false;

export const metadata: Metadata = {
  title: "Khusus Peserta Rakernas 2027",
  robots: { index: false },
};

async function AccessContent({ contactUrl }: { contactUrl: string }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ParticipantAccessCard account={null} contactUrl={contactUrl} />;

  // Baca identitas hanya untuk sesi sendiri, tanpa menampilkan foto Google.
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("role, nama, nama_google")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ParticipantAccessCard
      contactUrl={contactUrl}
      account={{
        email: user.email ?? "",
        name: profile?.nama?.trim() || profile?.nama_google?.trim() || "",
        isNonParticipant: profile?.role === "user",
        isGoogle: user.app_metadata.provider === "google",
      }}
    />
  );
}

/** Halaman tujuan ProfileGate untuk akun yang belum terdaftar sebagai peserta. */
export default async function KhususPesertaPage() {
  const settings = await getEventSettings();
  return (
    <>
      <main id="participant-access" className="relative isolate min-w-0 flex-1 overflow-hidden bg-brand-green-night px-5 pt-[calc(112px+env(safe-area-inset-top))] pb-20 lg:pt-[calc(206px+env(safe-area-inset-top))] lg:pb-[120px]">
        <Image src="/galeri-fasilitas-hotel/kamar.jpg" alt="" fill preload sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-brand-green-night/95 to-brand-green-deep/80 lg:bg-linear-to-l" />
        <Suspense fallback={<ParticipantAccessCard account={null} contactUrl={settings.footerUrl} />}>
          <AccessContent contactUrl={settings.footerUrl} />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </>
  );
}
