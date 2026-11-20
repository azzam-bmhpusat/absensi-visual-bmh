import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin";
import { createQrToken } from "@/lib/absen-token";

const headers = { "Cache-Control": "no-store" };

/** URL QR dinamis untuk layar lokasi. Hanya untuk admin yang sudah login. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { user, isAdmin } = await checkAdmin(supabase);

  if (!user) {
    return Response.json({ message: "Hanya admin yang dapat membuka QR presensi." }, { status: 401, headers });
  }
  if (!isAdmin) {
    return Response.json({ message: "Hanya admin yang dapat membuka QR presensi." }, { status: 403, headers });
  }

  let qr: ReturnType<typeof createQrToken>;
  try {
    qr = createQrToken();
  } catch (err) {
    console.error("Gagal membuat token QR presensi:", err);
    return Response.json(
      {
        message:
          "QR belum bisa dibuat: environment variable ABSEN_TOKEN_SECRET belum diatur di server (minimal 16 karakter). Atur di Vercel lalu redeploy.",
      },
      { status: 500, headers }
    );
  }

  const url = new URL("/absen/scan", new URL(request.url).origin);
  url.searchParams.set("t", qr.token);

  return Response.json({ url: url.toString(), expiresAt: qr.expiresAt, serverNow: Date.now() }, { headers });
}
