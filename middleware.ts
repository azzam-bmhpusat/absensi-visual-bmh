import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Semua halaman, agar sesi login selalu disegarkan dan disimpan ke cookie (tetap login sampai
     * menekan Keluar). Dikecualikan: API, aset Next.js, file statis, serta file PWA
     * (/sw.js, /offline.html, /manifest.webmanifest, /icons/*.png).
     * Aturan akses per rute ada di lib/supabase/middleware.ts.
     */
    "/((?!api/|_next/static|_next/image|sw\\.js$|offline\\.html$|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|txt|xml|webmanifest|mp4|pdf)$).*)",
  ],
};
