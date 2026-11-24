import type { Metadata } from "next";
import { connection } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

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

  const [attendancesRes, sessionsRes] = await Promise.all([
    supabase.from("attendances").select("id"),
    supabase.from("sessions").select("id, nama, is_active").order("id", { ascending: true }),
  ]);

  const attendancesCount = (attendancesRes.data || []).length;
  const activeSessionsCount = (sessionsRes.data || []).filter(
    (s) => s.is_active !== false
  ).length;

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <AppSidebar
        attendancesCount={attendancesCount}
        activeSessionsCount={activeSessionsCount}
        sessions={(sessionsRes.data || []).map((s) => ({
          id: s.id as number,
          nama: (s.nama as string | null) ?? `Sesi ${s.id}`,
        }))}
      />
      <SidebarInset className="page-bg min-w-0">
        <AdminHeader />
        <div className="min-w-0 w-full flex-1 px-4 py-4 sm:py-6 lg:py-8">
          <div className="min-w-0 w-full space-y-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
