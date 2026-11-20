"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { Menu } from "lucide-react";
import { useLenis } from "lenis/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EVENT_INFO, NAV_ITEMS } from "@/content/rakernas";
import { scrollToElementWhenReady } from "@/lib/scroll-to-element";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const lenis = useLenis();
  const pathname = usePathname();
  // Anchor section (#rundown, dst.) hanya ada di beranda. Di halaman lain (mis. /registrasi)
  // menu menuju "/#section" lewat navigasi client-side; navbar ini tetap terpasang.
  const isHome = pathname === "/";
  const navHref = (href: string) => (isHome ? href : `/${href}`);

  // Setelah berpindah ke "/#section" dari halaman lain (atau memuat URL ber-hash),
  // gulir ke section tersebut lewat Lenis (Lenis menahan scroll native).
  useEffect(() => {
    if (!isHome) return;
    const hash = window.location.hash;
    if (!NAV_ITEMS.some((item) => item.href === hash)) return;
    // Konten beranda bisa baru muncul setelah navigasi: helper mencoba ulang sampai
    // section benar-benar berada di bawah navbar (scroll-mt-20 = 80px).
    return scrollToElementWhenReady({
      lenis,
      getElement: () => document.getElementById(hash.slice(1)),
      offset: 80,
    });
  }, [isHome, lenis]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeMobileMenu = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeMobileMenu);
    return () => desktop.removeEventListener("change", closeMobileMenu);
  }, []);

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const targetId = href.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        // Lenis menghormati scroll-margin-top pada section (scroll-mt-20)
        if (lenis) lenis.scrollTo(elem, { duration: 1.2 });
        else elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur border-b border-line">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between gap-4 px-5 md:px-8">
        {/* Logo Kiri (Tautan ke /) */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-label={EVENT_INFO.name}
        >
          <Image
            src={EVENT_INFO.logoSrc}
            alt={EVENT_INFO.logoAlt}
            width={38}
            height={36}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Navigasi langsung pada laptop dan desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={navHref(item.href)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-11 px-3 text-sm text-ink hover:bg-secondary hover:text-primary",
              )}
              onClick={(event) => {
                // Di luar beranda biarkan Link berpindah halaman
                if (!isHome) return;
                if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                event.preventDefault();
                handleNavClick(item.href);
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Area kanan: Daftar + Hamburger */}
        <div className="flex items-center gap-2">
          {/* Tombol Daftar — selalu tampil */}
          <Link
            href="/registrasi"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors",
              "bg-[var(--brand-green)] hover:bg-[var(--brand-green-deep)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            Daftar
          </Link>

          {/* Hamburger untuk HP dan tablet */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-lg text-ink hover:text-primary hover:bg-secondary focus-visible:ring-ring lg:hidden"
                  aria-label="Buka menu navigasi"
                />
              }
            >
              <Menu className="size-6" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-line bg-popover p-1.5 shadow-lg lg:hidden"
            >
              {NAV_ITEMS.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="flex min-h-[44px] cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-secondary hover:text-primary transition-colors focus:bg-secondary focus:text-primary"
                >
                  <Link
                    href={navHref(item.href)}
                    onClick={(e) => {
                      if (!isHome) return;
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className="w-full"
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
