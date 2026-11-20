import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path request admin dan dashboard
     */
    "/admin/:path*",
    "/dashboard/:path*",
    "/guest/:path*",
    "/rekap-kehadiran/:path*",
    "/kelola-sesi-acara/:path*",
    "/pengaturan/:path*",
    "/approval/:path*",
    "/manajemen-user/:path*",
  ],
};
