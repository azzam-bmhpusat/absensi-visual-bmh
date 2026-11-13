"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarClock,
} from "lucide-react";

interface AdminNavBarProps {
  guestsCount?: number;
  attendancesCount?: number;
  activeSessionsCount?: number;
}

export function AdminNavBar({
  guestsCount,
  attendancesCount,
  activeSessionsCount,
}: AdminNavBarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard Analitik",
      href: "/dashboard",
      icon: LayoutDashboard,
      activeColor: "text-brand-green",
      badge: null,
    },
    {
      label: "Daftar Tamu Undangan",
      href: "/guest",
      icon: Users,
      activeColor: "text-brand-green",
      badge: guestsCount !== undefined ? `${guestsCount}` : null,
      badgeColor: "bg-secondary text-primary",
    },
    {
      label: "Rekap Kehadiran",
      href: "/rekap-kehadiran",
      icon: ClipboardList,
      activeColor: "text-brand-gold-text",
      badge: attendancesCount !== undefined ? `${attendancesCount}` : null,
      badgeColor: "bg-gold-100 text-brand-gold-text",
    },
    {
      label: "Kelola Sesi Acara",
      href: "/kelola-sesi-acara",
      icon: CalendarClock,
      activeColor: "text-primary",
      badge:
        activeSessionsCount !== undefined
          ? `${activeSessionsCount} Aktif`
          : null,
      badgeColor: "bg-green-100 text-brand-green-deep",
    },
  ];

  return (
    <nav className="bg-muted p-1 rounded-2xl border border-line flex flex-wrap gap-1 w-full max-w-full">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 select-none ${
              isActive
                ? "bg-white text-primary shadow-2xs font-bold"
                : "text-ink-muted hover:text-primary hover:bg-white/60"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isActive ? item.activeColor : "text-ink-muted"
              }`}
            />
            <span>{item.label}</span>
            {item.badge && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  item.badgeColor || "bg-muted text-ink-muted"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
