import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUserQrToken } from "@/lib/absen-token";

/** Token QR absensi pengguna yang sedang login, atau null bila belum login. */
export async function getMyQrToken(): Promise<string | null> {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? createUserQrToken(data.user.id) : null;
}
