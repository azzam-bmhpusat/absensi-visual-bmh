import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/auth/admin";

/** Halaman yang hanya untuk admin / peserta dengan profil lengkap. */
const MEMBER_PATHS = [
  "/informasi-kamar-hotel",
  "/publikasi/foto-galeri-kegiatan",
  "/publikasi/materi-presentasi-rakernas",
  "/publikasi/notula-rapat",
];

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

  const { pathname } = request.nextUrl;

  // Sesi login disegarkan di SETIAP halaman (bukan hanya rute terproteksi). Bila token disegarkan
  // dari Server Component (mis. navbar), cookie baru tidak bisa disimpan; refresh token lama lalu
  // dianggap dipakai ulang oleh Supabase dan sesi dicabut (user ter-logout sendiri).
  // Pengunjung tanpa cookie sesi dilewati tanpa panggilan jaringan.
  if (!hasSessionCookie(request)) {
    return guard(request, response, pathname, { user: null, isAdmin: false });
  }

  // getUser() membaca & menyegarkan token; is_admin() (role di profiles) hanya dicek di rute admin.
  const needsAdminCheck = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const auth = needsAdminCheck
    ? await checkAdmin(supabase)
    : { user: (await supabase.auth.getUser()).data.user, isAdmin: false };

  return guard(request, response, pathname, auth);
}

/** Cookie sesi Supabase: sb-<ref>-auth-token (bisa terpecah jadi .0, .1, ...). */
function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
}

/** Rute admin yang wajib login sebagai admin. */
const ADMIN_PATHS = ["/dashboard", "/rekap-kehadiran", "/kelola-sesi-acara", "/pengaturan", "/manajemen-user", "/admin"];

/** Aturan akses per rute. `response` membawa cookie sesi yang baru disegarkan. */
function guard(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  { user, isAdmin }: { user: unknown; isAdmin: boolean }
) {

  const isProtectedPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // /profile wajib login; /login untuk yang sudah login langsung ke /profile
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent("/profile")}`;
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }
  // Halaman khusus peserta: wajib login (kelengkapan profil dicek di ProfileGate)
  const memberPath = MEMBER_PATHS.find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (memberPath) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(memberPath)}`;
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }
  if (pathname === "/login" || pathname === "/login/") {
    if (user) {
      const profileUrl = request.nextUrl.clone();
      profileUrl.pathname = "/profile";
      profileUrl.search = "";
      return NextResponse.redirect(profileUrl);
    }
    return response;
  }

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
