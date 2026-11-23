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
    "/rekap-kehadiran/:path*",
    "/kelola-sesi-acara/:path*",
    "/pengaturan/:path*",
    "/manajemen-user/:path*",
    "/profile/:path*",
    "/informasi-kamar-hotel/:path*",
    "/publikasi/foto-galeri-kegiatan/:path*",
    "/publikasi/materi-presentasi-rakernas/:path*",
    "/publikasi/notula-rapat/:path*",
    "/login",
  ],
};
