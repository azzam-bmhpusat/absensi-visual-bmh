"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAdmin } from "@/app/admin/actions";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarClock,
  QrCode,
  Monitor,
  LogOut,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  guestsCount?: number;
  attendancesCount?: number;
  activeSessionsCount?: number;
}

export function AppSidebar({
  guestsCount,
  attendancesCount,
  activeSessionsCount,
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
  ];

  const generalItems = [
    { label: "Cetak QR Absen", href: "/admin/qr", icon: QrCode },
    {
      label: "Buka Videotron",
      href: "/display",
      icon: Monitor,
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
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-sm font-bold text-primary-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:text-xs">
            BMH
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-bold text-primary">
              Absensi Visual
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Panel Administrasi
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

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
                        className={isActive ? "text-brand-green" : "text-ink-muted"}
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

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        {/* Card promo ala desain (pengganti AdminHeader) */}
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="rounded-2xl bg-gradient-to-b from-primary to-brand-green-night p-4 text-primary-foreground">
            <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <QrCode className="h-4 w-4 text-brand-gold-soft" />
            </div>
            <p className="font-heading text-sm font-bold">Buka Halaman Absen</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-100/80">
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
