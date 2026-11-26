"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { logoutAdmin } from "@/app/admin/actions";
import {
  ArrowUpRight, BedDouble, CalendarClock, ChevronDown, ClipboardList, FilePen, Images,
  NotebookPen, Presentation,
  LayoutDashboard, LogOut, Monitor, QrCode, ScanLine, Settings,
  Theater, UserCog, X, type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  attendancesCount?: number;
  activeSessionsCount?: number;
  sessions?: { id: number; nama: string }[];
}

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  external?: boolean;
}

// Adapted from shadcn sidebar-03: grouped, visible submenus and an offcanvas rail.
const subButtonClass =
  "relative h-9 flex-1 gap-2.5 rounded-lg px-2.5 text-[13px] text-sidebar-foreground/80 max-md:h-11 max-md:gap-2 " +
  "[&>svg]:size-4 [&>svg]:text-current hover:bg-sidebar-accent hover:text-sidebar-accent-foreground " +
  "data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground " +
  "data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground " +
  "data-active:[&>svg]:text-sidebar-primary-foreground";

export function AppSidebar({
  attendancesCount,
  activeSessionsCount,
  sessions = [],
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const groups: { label: string; icon: LucideIcon; items: NavigationItem[] }[] = [
    {
      label: "Administrasi",
      icon: LayoutDashboard,
      items: [
        { label: "Dashboard Analitik", href: "/dashboard", icon: LayoutDashboard },
        { label: "Manajemen User", href: "/manajemen-user", icon: UserCog },
        { label: "Pengaturan", href: "/pengaturan", icon: Settings },
      ],
    },
    {
      label: "Absensi",
      icon: ScanLine,
      items: [
        {
          label: "Rekap Kehadiran", href: "/rekap-kehadiran", icon: ClipboardList,
          badge: attendancesCount !== undefined ? `${attendancesCount}` : undefined,
        },
        { label: "Scan QR Absensi", href: "/scan-absen", icon: ScanLine },
        {
          label: "Kelola Sesi Acara", href: "/kelola-sesi-acara", icon: CalendarClock,
          badge: activeSessionsCount !== undefined ? `${activeSessionsCount} Aktif` : undefined,
        },
        { label: "Cetak QR Absen", href: "/admin/qr", icon: QrCode },
        { label: "QR Live Absen", href: "/admin/qr/live", icon: ScanLine },
      ],
    },
    {
      label: "Kelola Konten",
      icon: FilePen,
      items: [
        { label: "Informasi Kamar Hotel", href: "/kelola-konten/kamar-hotel", icon: BedDouble },
        { label: "Foto Galeri Kegiatan", href: "/kelola-konten/foto-galeri", icon: Images },
        { label: "Materi Presentasi", href: "/kelola-konten/materi-presentasi", icon: Presentation },
        { label: "Notula Rapat", href: "/kelola-konten/notula-rapat", icon: NotebookPen },
      ],
    },
    {
      label: "Videotron",
      icon: Monitor,
      items: [
        { label: "Buka Videotron", href: "/display", icon: Monitor, external: true },
        { label: "Videotron Aula", href: "/display-absen", icon: Theater, external: true },
      ],
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="h-20 justify-center border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            onClick={closeMobile}
            aria-label="Rakernas BMH — dashboard"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Image
              src="/no-bg-white-logo.png"
              alt="Logo Rakernas BMH 2027"
              width={578}
              height={432}
              className="size-full object-contain"
              preload
            />
          </Link>
          <div className="min-w-0 flex-1 leading-snug">
            <p className="text-sm font-semibold text-sidebar-foreground">Panel Admin</p>
            <p className="mt-0.5 text-[11px] text-brand-gold-soft">Rakernas BMH 2027</p>
          </div>
          {isMobile && (
            <button
              type="button"
              aria-label="Tutup sidebar"
              onClick={() => setOpenMobile(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-3">
        <nav aria-label="Navigasi administrasi">
          {groups.map((group) => (
            <SidebarGroup key={group.label} className="px-1 py-1.5">
              <SidebarGroupLabel
                render={<h2 />}
                className="mb-1 gap-2.5 px-2 text-[11px] font-semibold tracking-wide text-sidebar-foreground/60"
              >
                <group.icon aria-hidden="true" className="size-4" />
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSub className="mr-0 ml-4 gap-1 border-sidebar-border py-0 pl-3 max-md:ml-2 max-md:pl-2">
                    {group.items.map((item) => {
                      const active = !item.external &&
                        (pathname === item.href || (item.href !== "/admin/qr" && pathname.startsWith(`${item.href}/`)));
                      const isAula = item.href === "/display-absen";
                      return (
                        <SidebarMenuSubItem key={item.href}>
                          <div className="flex items-center gap-1">
                            <SidebarMenuSubButton
                              className={subButtonClass}
                              isActive={active}
                              render={
                                <Link
                                  href={item.href}
                                  aria-current={active ? "page" : undefined}
                                  target={item.external ? "_blank" : undefined}
                                  rel={item.external ? "noopener noreferrer" : undefined}
                                  onClick={closeMobile}
                                />
                              }
                            >
                              <item.icon aria-hidden="true" />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              {item.badge !== undefined && (
                                <span className="shrink-0 rounded-md bg-brand-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-green-night tabular-nums">
                                  {item.badge}
                                </span>
                              )}
                              {item.external && (
                                <ArrowUpRight aria-hidden="true" className="size-3! opacity-50" />
                              )}
                            </SidebarMenuSubButton>
                            {isAula && sessions.length > 0 && (
                              <button
                                type="button"
                                aria-label="Daftar sesi Videotron Aula"
                                aria-expanded={sessionsOpen}
                                aria-controls="sidebar-videotron-sessions"
                                onClick={() => setSessionsOpen((open) => !open)}
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring max-md:size-11"
                              >
                                <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${sessionsOpen ? "rotate-180" : ""}`} />
                              </button>
                            )}
                          </div>
                          {isAula && sessions.length > 0 && sessionsOpen && (
                            <SidebarMenuSub id="sidebar-videotron-sessions" className="mr-0 ml-4 gap-1 border-sidebar-border pr-0">
                              {sessions.map((session) => (
                                <SidebarMenuSubItem key={session.id}>
                                  <SidebarMenuSubButton
                                    className={`${subButtonClass} h-auto min-h-11 py-2`}
                                    render={
                                      <Link
                                        href={`/display-absen?sesi=${session.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={closeMobile}
                                        title={session.nama}
                                      />
                                    }
                                  >
                                    <span className="flex min-w-0 flex-col gap-0.5">
                                      <span className="text-xs font-medium">Sesi {session.id}</span>
                                      <span className="truncate text-[11px] text-sidebar-foreground/60">{session.nama}</span>
                                    </span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-10 justify-between rounded-xl border border-sidebar-border bg-sidebar-accent px-3 text-sidebar-foreground max-md:h-11"
              render={<Link href="/absen" target="_blank" rel="noopener noreferrer" onClick={closeMobile} />}
            >
              <QrCode aria-hidden="true" className="text-brand-gold-soft" />
              <span className="flex-1">Buka Halaman Absen</span>
              <ArrowUpRight aria-hidden="true" className="opacity-60" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-9 rounded-lg px-3 text-sidebar-foreground/65 hover:bg-red-500/15 hover:text-red-200 max-md:h-11"
              onClick={() => startTransition(async () => { await logoutAdmin(); })}
              disabled={isPending}
            >
              <LogOut aria-hidden="true" />
              <span>{isPending ? "Keluar..." : "Keluar"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
