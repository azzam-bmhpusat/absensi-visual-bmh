"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpRight, ChevronDown, LogOut, Settings, ShieldCheck } from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard Analitik",
  "/rekap-kehadiran": "Rekap Kehadiran",
  "/kelola-sesi-acara": "Kelola Sesi Acara",
  "/manajemen-user": "Manajemen User",
  "/pengaturan": "Pengaturan",
};

const menuItemClass =
  "min-h-10 cursor-pointer gap-2.5 rounded-lg px-3 text-ink focus:bg-secondary focus:text-primary not-data-[variant=destructive]:focus:**:text-primary data-highlighted:bg-secondary data-highlighted:text-primary";

export function AdminHeader() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const page = Object.entries(PAGE_LABELS).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  )?.[1] ?? "Panel Admin";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-background/95 px-4 backdrop-blur-md sm:gap-4 md:h-20">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <SidebarTrigger
          aria-label="Buka atau tutup sidebar"
          className="size-11 shrink-0 rounded-xl border border-line bg-background text-primary shadow-2xs hover:bg-secondary hover:text-primary"
        />
        <Separator orientation="vertical" className="hidden h-5 self-center bg-line sm:block" />
        <Breadcrumb className="min-w-0" aria-label="Lokasi halaman admin">
          <BreadcrumbList className="flex-nowrap gap-2 text-sm">
            <BreadcrumbItem className="hidden shrink-0 xl:inline-flex">
              <BreadcrumbLink
                render={<Link href="/dashboard" />}
                className="rounded-sm text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Administrasi
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden text-ink-muted/50 xl:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate font-semibold text-primary">{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
        >
          Lihat situs
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Menu administrator"
                className="group/admin flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-background px-2 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-secondary sm:gap-2.5 sm:px-3"
              />
            }
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="text-xs font-semibold text-primary">Administrator</span>
              <span className="mt-0.5 text-[10px] text-ink-muted">Rakernas BMH</span>
            </span>
            <ChevronDown aria-hidden="true" className="size-3.5 text-ink-muted transition-transform group-data-popup-open/admin:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 rounded-2xl border border-line bg-popover p-1.5 shadow-lg shadow-brand-green-deep/10 ring-0"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-[11px] font-semibold text-ink-muted">Panel Administrasi</DropdownMenuLabel>
              <DropdownMenuItem className={menuItemClass} render={<Link href="/pengaturan" />}>
                <Settings aria-hidden="true" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem className={menuItemClass} render={<Link href="/" target="_blank" rel="noopener noreferrer" />}>
                <ArrowUpRight aria-hidden="true" />
                Lihat situs
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1 my-1 bg-line" />
              <DropdownMenuItem
                variant="destructive"
                className="min-h-10 cursor-pointer gap-2.5 rounded-lg px-3"
                disabled={isPending}
                onClick={() => startTransition(async () => { await logoutAdmin(); })}
              >
                <LogOut aria-hidden="true" />
                {isPending ? "Keluar..." : "Keluar"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
