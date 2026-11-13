import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Placeholder middleware: Fase 4 akan mengaktifkan proteksi auth penuh
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    // Akan dicek auth token Supabase di Fase 4
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
