"use client";

import Link from "next/link";
import Image from "next/image";
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

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const lenis = useLenis();

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
            <a
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-11 px-3 text-sm text-ink hover:bg-secondary hover:text-primary",
              )}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                event.preventDefault();
                handleNavClick(item.href);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

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
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className="w-full"
                >
                  {item.label}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
