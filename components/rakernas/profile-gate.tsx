import { redirect } from "next/navigation";
import { connection } from "next/server";
import { checkAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProfileComplete } from "@/lib/profile-contact";
import { CompleteProfileDialog } from "@/components/rakernas/complete-profile-dialog";

/**
 * Batasi konten untuk admin dan peserta yang profilnya sudah lengkap.
 * Belum login -> /login;
 * profil belum lengkap -> dialog lengkapi profil (children tidak dirender).
 */
export async function ProfileGate({ path, children }: { path: string; children?: React.ReactNode }) {
  await connection();
  const supabase = await createClient();
  const { user, isAdmin } = await checkAdmin(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (isAdmin) return <>{children}</>;

  // Kolom no_whatsapp / rencana_kedatangan privat: dibaca server-side untuk akun sendiri saja.
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("nama, perwakilan_daerah, jabatan, ukuran_baju, no_whatsapp, rencana_kedatangan, keterangan_kehadiran")
    .eq("id", user.id)
    .maybeSingle();

  if (!isProfileComplete(profile)) return <CompleteProfileDialog />;
  return <>{children}</>;
}
