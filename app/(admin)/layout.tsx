import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient, createPublicServerClient } from "@/lib/supabase/server";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Search, Bell, Mail } from "lucide-react";

// Admin routes depend on live Supabase data; allow a blocking render
// instead of requiring every data access to be wrapped in Suspense.
export const instant = false;

export const metadata: Metadata = {
  title: "Admin Panel Kehadiran BMH",
  description: "Panel administrasi, rekap data kehadiran, manajemen tamu, dan dashboard visual BMH",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sesi admin (cookie) memakai waktu sekarang untuk cek token: tandai render per-request dulu
  await connection();
  const supabase = createPublicServerClient();
  // registrations hanya bisa dibaca sesi admin (RLS), jadi pakai client berbasis cookie
  const adminSupabase = await createClient();

  const [guestsRes, attendancesRes, sessionsRes, pendingRes] = await Promise.all([
    supabase.from("profiles").select("id").not("nama", "is", null),
    supabase.from("attendances").select("id"),
    supabase.from("sessions").select("id, is_active"),
    adminSupabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const pendingApprovalCount = pendingRes.error ? undefined : (pendingRes.count ?? 0);

  const guestsCount = (guestsRes.data || []).length;
  const attendancesCount = (attendancesRes.data || []).length;
  const activeSessionsCount = (sessionsRes.data || []).filter(
    (s) => s.is_active !== false
  ).length;

  return (
    <SidebarProvider>
      <AppSidebar
        guestsCount={guestsCount}
        attendancesCount={attendancesCount}
        activeSessionsCount={activeSessionsCount}
        pendingApprovalCount={pendingApprovalCount}
      />
      <SidebarInset className="page-bg">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line/60 bg-white/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="shrink-0 text-ink-muted hover:text-primary" />
          <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-full bg-surface px-4">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              type="text"
              placeholder="Cari tamu atau presensi..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-ink-muted"
            />
            <kbd className="hidden shrink-0 rounded-md border border-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-muted sm:block">
              Ctrl K
            </kbd>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Notifikasi"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-muted transition-colors hover:text-primary sm:flex"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Pesan"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-muted transition-colors hover:text-primary sm:flex"
            >
              <Mail className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 font-heading text-xs font-bold text-primary">
                AB
              </span>
              <span className="hidden flex-col leading-tight lg:flex">
                <span className="text-xs font-semibold text-foreground">
                  Admin BMH
                </span>
                <span className="text-[10px] text-ink-muted">
                  admin@bmh.or.id
                </span>
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}