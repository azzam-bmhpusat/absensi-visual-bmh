import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() reads and refreshes the auth token securely
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Daftar rute admin yang wajib login
  const protectedAdminPaths = [
    "/dashboard",
    "/guest",
    "/rekap-kehadiran",
    "/kelola-sesi-acara",
    "/pengaturan",
    "/admin",
  ];

  const isProtectedPath = protectedAdminPaths.some((p) => pathname.startsWith(p));

  // Redirect /admin langsung ke /dashboard jika sudah atau belum login
  if (pathname === "/admin" || pathname === "/admin/") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  // Proteksi rute admin kecuali halaman login /admin/login
  if (isProtectedPath && !pathname.startsWith("/admin/login")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Jika sudah terautentikasi dan membuka /admin/login, alihkan ke /dashboard
  if (pathname.startsWith("/admin/login") && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
