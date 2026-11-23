"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAdmin } from "@/app/admin/actions";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  Settings,
  QrCode,
  Monitor,
  Boxes,
  Theater,
  LogOut,
  UserCog,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AppSidebarProps {
  attendancesCount?: number;
  activeSessionsCount?: number;
  sessions?: { id: number; nama: string }[];
}

// Item menu: area sentuh lebih tinggi di mobile, ikon redup kecuali aktif/hover,
// aktif = blok hijau terang + garis emas di kiri (disembunyikan saat collapse ke ikon).
const menuButtonClass =
  "relative max-md:h-11 [&_svg]:opacity-80 hover:[&_svg]:opacity-100 data-active:[&_svg]:opacity-100 " +
  "data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground " +
  "data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground " +
  "data-active:before:absolute data-active:before:inset-y-1.5 data-active:before:left-0 data-active:before:w-[3px] " +
  "data-active:before:rounded-full data-active:before:bg-brand-gold-soft group-data-[collapsible=icon]:before:hidden";

const groupLabelClass =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/60";

// Badge tetap gelap-di-atas-terang, termasuk saat item aktif/hover
const badgeTextClass =
  "font-semibold text-brand-green-night peer-hover/menu-button:text-brand-green-night peer-data-active/menu-button:text-brand-green-night";

export function AppSidebar({
  attendancesCount,
  activeSessionsCount,
  sessions = [],
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { isMobile, setOpenMobile } = useSidebar();

  // Di mobile sidebar berupa Sheet: tutup setelah memilih menu
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const navItems = [
    {
      label: "Dashboard Analitik",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null as string | null,
      badgeColor: "",
    },
    {
      label: "Rekap Kehadiran",
      href: "/rekap-kehadiran",
      icon: ClipboardList,
      badge: attendancesCount !== undefined ? `${attendancesCount}` : null,
      badgeColor: "bg-brand-gold-soft",
    },
    {
      label: "Kelola Sesi Acara",
      href: "/kelola-sesi-acara",
      icon: CalendarClock,
      badge:
        activeSessionsCount !== undefined
          ? `${activeSessionsCount} Aktif`
          : null,
      badgeColor: "bg-brand-green",
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

  const isActivePath = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
    });
  };

  const videotronAulaButton = (
    <SidebarMenuButton
      className={menuButtonClass}
      render={
        <Link
          href="/display-absen"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMobile}
        />
      }
      tooltip="Videotron Aula"
    >
      <Theater />
      <span>Videotron Aula</span>
    </SidebarMenuButton>
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border p-2">
        <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-200 ease-linear">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-2xs ring-1 ring-white/20 transition-all duration-200 ease-linear group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:rounded-lg">
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
            <span className="font-heading text-sm font-bold text-sidebar-foreground whitespace-nowrap">
              Rakernas BMH 2027
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-gold-soft whitespace-nowrap">
              Panel Administrasi
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={groupLabelClass}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      className={menuButtonClass}
                      render={<Link href={item.href} onClick={closeMobile} />}
                      isActive={isActivePath(item.href)}
                      tooltip={item.label}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge
                        className={`${item.badgeColor} ${badgeTextClass} max-md:top-3!`}
                      >
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
          <SidebarGroupLabel className={groupLabelClass}>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      className={menuButtonClass}
                      render={
                        <Link
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noopener noreferrer" : undefined}
                          onClick={closeMobile}
                        />
                      }
                      isActive={!item.external && pathname === item.href}
                      tooltip={item.label}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                {sessions.length === 0 ? (
                  videotronAulaButton
                ) : isMobile ? (
                  // Layar sentuh tidak punya hover: tampilkan daftar sesi langsung
                  <>
                    {videotronAulaButton}
                    <SidebarMenuSub>
                      {sessions.map((s) => (
                        <SidebarMenuSubItem key={s.id}>
                          <SidebarMenuSubButton
                            className="h-auto py-2"
                            render={
                              <Link
                                href={`/display-absen?sesi=${s.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMobile}
                              />
                            }
                          >
                            <span className="flex min-w-0 flex-col">
                              <span className="font-medium">Sesi {s.id}</span>
                              <span className="truncate text-[11px] text-sidebar-foreground/70">
                                {s.nama}
                              </span>
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <Popover>
                    <PopoverTrigger
                      nativeButton={false}
                      openOnHover
                      delay={80}
                      closeDelay={150}
                      render={
                        <SidebarMenuButton
                          className={menuButtonClass}
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
                      <Theater />
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
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={`${menuButtonClass} hover:bg-red-500/15 hover:text-red-200`}
                  onClick={handleLogout}
                  disabled={isPending}
                  tooltip={isPending ? "Keluar..." : "Keluar"}
                >
                  <LogOut />
                  <span>{isPending ? "Keluar..." : "Keluar"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="overflow-hidden transition-[opacity,max-height,padding] duration-200 ease-linear max-h-96 opacity-100 group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:p-0 [@media(max-height:640px)]:hidden">
        <div className="rounded-2xl bg-gradient-to-b from-primary to-brand-green-night p-4 text-primary-foreground ring-1 ring-white/10">
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
            onClick={closeMobile}
            className="mt-3 flex items-center justify-center rounded-full bg-brand-green py-2 text-xs font-bold text-brand-green-night transition-colors hover:bg-brand-gold-soft"
          >
            Buka Sekarang
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
