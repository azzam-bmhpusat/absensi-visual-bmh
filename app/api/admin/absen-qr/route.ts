import { createClient } from "@/lib/supabase/server";
import { createQrToken } from "@/lib/absen-token";

const headers = { "Cache-Control": "no-store" };

/** URL QR dinamis untuk layar lokasi. Hanya untuk admin yang sudah login. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ message: "Hanya admin yang dapat membuka QR presensi." }, { status: 401, headers });
  }

  const { token, expiresAt } = createQrToken();
  const url = new URL("/absen/scan", new URL(request.url).origin);
  url.searchParams.set("t", token);

  return Response.json({ url: url.toString(), expiresAt, serverNow: Date.now() }, { headers });
}
