import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { isoToWibLocal } from "@/lib/profile-contact";

export const metadata: Metadata = {
  title: "Profil Saya",
  robots: { index: false, follow: false },
};

async function ProfileContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fprofile");

  // Kolom no_whatsapp / rencana_kedatangan privat: dibaca server-side untuk akun sendiri saja.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("nama, perwakilan_daerah, jabatan, ukuran_baju, no_whatsapp, rencana_kedatangan, keterangan_kehadiran")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl font-bold text-primary">Profil Saya</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            key={`${user.email}-${profile?.nama}-${profile?.rencana_kedatangan}`}
            initial={{
              email: user.email ?? "",
              nama: profile?.nama ?? "",
              perwakilanDaerah: profile?.perwakilan_daerah ?? "",
              jabatan: profile?.jabatan ?? "",
              ukuranBaju: profile?.ukuran_baju ?? "",
              noWhatsapp: profile?.no_whatsapp ?? "",
              rencanaKedatangan: isoToWibLocal(profile?.rencana_kedatangan),
              keteranganKehadiran: profile?.keterangan_kehadiran ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6">
      <Suspense fallback={null}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}
