import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBmhEmail, safeNextPath } from "@/lib/profile-contact";

/**
 * Kembali dari Google (OAuth PKCE): tukar `code` menjadi sesi (cookie), lalu ke `next`.
 * Gagal, dibatalkan, atau tanpa code -> /login?error=google.
 * Email di luar @bmh.or.id -> sesi dibuang, /login?error=google_domain.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code && !searchParams.get("error")) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (isBmhEmail(data?.user?.email)) return NextResponse.redirect(new URL(next, request.url));
      await supabase.auth.signOut();
      const deniedUrl = new URL("/login", request.url);
      deniedUrl.searchParams.set("error", "google_domain");
      return NextResponse.redirect(deniedUrl);
    }
    console.error("Gagal menukar kode login Google:", error.message);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "google");
  if (next !== "/profile") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
