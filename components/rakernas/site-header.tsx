"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EVENT_INFO, NAV_ITEMS } from "@/content/rakernas";

export function SiteHeader() {
  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const targetId = href.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur border-b border-line">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-5 md:px-8">
        {/* Logo Kiri (Tautan ke /) */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
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

        {/* Menu Navigasi Kanan (Dropdown shadcn) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-lg text-ink hover:text-primary hover:bg-secondary focus-visible:ring-ring"
                aria-label="Buka menu navigasi"
              />
            }
          >
            <Menu className="size-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border border-line bg-popover p-1.5 shadow-lg"
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
