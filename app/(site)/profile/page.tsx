import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PublicFooter } from "@/components/rakernas/public-page";
import { ProfileForm } from "@/components/profile/profile-form";
import { isoToWibLocal } from "@/lib/profile-contact";
import { mustChangePassword } from "@/lib/password-policy";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { avatarPublicUrl } from "@/lib/avatar";

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
    .select("role, nama, perwakilan_daerah, jabatan, ukuran_baju, no_whatsapp, rencana_kedatangan, keterangan_kehadiran, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // Peserta dengan kata sandi awal: data profil tidak dirender sampai kata sandi diganti.
  if (mustChangePassword(user, profile?.role)) return <ChangePasswordDialog />;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
        <CardHeader>
          <h1 className="font-heading text-xl font-bold text-primary">Profil Saya</h1>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload src={avatarPublicUrl(profile?.avatar_url)} name={profile?.nama || user.email || ""} />
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
    <>
      <main className="page-bg flex-1 px-4 py-10 sm:px-6">
        <Suspense fallback={null}>
          <ProfileContent />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </>
  );
}
