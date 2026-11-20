"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAdmin } from "@/app/admin/actions";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarClock,
  Settings,
  QrCode,
  Monitor,
  Boxes,
  Theater,
  LogOut,
  UserCog,
  Contact,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AppSidebarProps {
  guestsCount?: number;
  attendancesCount?: number;
  activeSessionsCount?: number;
  sessions?: { id: number; nama: string }[];
}

export function AppSidebar({
  guestsCount,
  attendancesCount,
  activeSessionsCount,
  sessions = [],
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const navItems = [
    {
      label: "Dashboard Analitik",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null as string | null,
      badgeColor: "",
    },
    {
      label: "Daftar Tamu Undangan",
      href: "/guest",
      icon: Users,
      badge: guestsCount !== undefined ? `${guestsCount}` : null,
      badgeColor: "bg-secondary text-primary",
    },
    { label: "Data Peserta", href: "/data-peserta", icon: Contact, badge: null, badgeColor: "" },
    {
      label: "Rekap Kehadiran",
      href: "/rekap-kehadiran",
      icon: ClipboardList,
      badge: attendancesCount !== undefined ? `${attendancesCount}` : null,
      badgeColor: "bg-gold-100 text-brand-gold-text",
    },
    {
      label: "Kelola Sesi Acara",
      href: "/kelola-sesi-acara",
      icon: CalendarClock,
      badge:
        activeSessionsCount !== undefined
          ? `${activeSessionsCount} Aktif`
          : null,
      badgeColor: "bg-green-100 text-brand-green-deep",
    },
    { label: "Manajemen User", href: "/manajemen-user", icon: UserCog, badge: null, badgeColor: "" },
    { label: "Pengaturan", href: "/pengaturan", icon: Settings, badge: null, badgeColor: "" },
  ];

  const generalItems = [
    { label: "Cetak QR Absen", href: "/admin/qr", icon: QrCode },
    { label: "QR Live Absen", href: "/admin/qr/live", icon: QrCode },
    {
      label: "Buka Videotron",
      href: "/display",
      icon: Monitor,
      external: true,
    },
    {
      label: "Videotron Anatomy",
      href: "/display-anatomy",
      icon: Boxes,
      external: true,
    },
  ];

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
    });
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border p-2">
        <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-200 ease-linear">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 border border-line shadow-2xs transition-all duration-200 ease-linear group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:rounded-lg">
            <Image
              src="/logo.png"
              alt="Logo BMH"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight overflow-hidden transition-[opacity,max-width] duration-200 ease-linear max-w-48 opacity-100 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="font-heading text-sm font-bold text-primary whitespace-nowrap">
              Rakernas BMH 2027
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted whitespace-nowrap">
              Panel Administrasi
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.12em]">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Icon
                        className={isActive ? "text-brand-green-text" : "text-ink-muted"}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className={item.badgeColor}>
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.12em]">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noopener noreferrer" : undefined}
                        />
                      }
                      tooltip={item.label}
                    >
                      <Icon className="text-ink-muted" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                {sessions.length > 0 ? (
                  <Popover>
                    <PopoverTrigger
                      nativeButton={false}
                      openOnHover
                      delay={80}
                      closeDelay={150}
                      render={
                        <SidebarMenuButton
                          render={
                            <Link
                              href="/display-absen"
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        />
                      }
                    >
                      <Theater className="text-ink-muted" />
                      <span>Videotron Aula</span>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      sideOffset={8}
                      className="w-56 gap-0.5 p-1.5"
                    >
                      {sessions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/display-absen?sesi=${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="font-medium">Sesi {s.id}</span>
                          <span className="truncate text-[11px] text-muted-foreground">
                            {s.nama}
                          </span>
                        </Link>
                      ))}
                    </PopoverContent>
                  </Popover>
                ) : (
                  <SidebarMenuButton
                    render={
                      <Link
                        href="/display-absen"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    tooltip="Videotron Aula"
                  >
                    <Theater className="text-ink-muted" />
                    <span>Videotron Aula</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  disabled={isPending}
                  tooltip={isPending ? "Keluar..." : "Keluar"}
                >
                  <LogOut className="text-ink-muted" />
                  <span>{isPending ? "Keluar..." : "Keluar"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="overflow-hidden transition-[opacity,max-height,padding] duration-200 ease-linear max-h-96 opacity-100 group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:p-0">
        {/* Card promo ala desain (pengganti AdminHeader) */}
        <div>
          <div className="rounded-2xl bg-gradient-to-b from-primary to-brand-green-night p-4 text-primary-foreground">
            <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <QrCode className="h-4 w-4 text-brand-gold-soft" />
            </div>
            <p className="font-heading text-sm font-bold">Buka Halaman Absen</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-white/80">
              Bagikan QR absensi ke peserta acara
            </p>
            <Link
              href="/absen"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center rounded-full bg-brand-green py-2 text-xs font-bold text-brand-green-night transition-colors hover:bg-brand-gold-soft"
            >
              Buka Sekarang
            </Link>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
