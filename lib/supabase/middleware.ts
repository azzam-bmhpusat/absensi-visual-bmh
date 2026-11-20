import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/auth/admin";

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

  // getUser() reads and refreshes the auth token securely; is_admin() memeriksa role di tabel profiles
  const { user, isAdmin } = await checkAdmin(supabase);

  const { pathname } = request.nextUrl;

  // Daftar rute admin yang wajib login
  const protectedAdminPaths = [
    "/dashboard",
    "/guest",
    "/rekap-kehadiran",
    "/kelola-sesi-acara",
    "/pengaturan",
    "/approval",
    "/manajemen-user",
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
    // Sudah login tetapi bukan admin: tolak (halaman login menampilkan pesannya)
    if (!isAdmin) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/admin/login";
      forbiddenUrl.search = "?error=forbidden";
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // Jika admin sudah terautentikasi dan membuka /admin/login, alihkan ke /dashboard.
  // Akun non-admin tetap melihat halaman login (menghindari redirect loop).
  if (pathname.startsWith("/admin/login") && user && isAdmin) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
