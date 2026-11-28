import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserQrToken } from "@/lib/absen-token";

/** Token QR absensi akun dengan kehadiran offline; null untuk kondisi lainnya. */
export async function getMyQrToken(): Promise<string | null> {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  // Keterangan kehadiran privat: baca di server untuk akun sendiri saja.
  const { data: profile, error } = await createAdminClient()
    .from("profiles")
    .select("keterangan_kehadiran")
    .eq("id", data.user.id)
    .maybeSingle();
  if (error || profile?.keterangan_kehadiran !== "offline") return null;

  return createUserQrToken(data.user.id);
}
