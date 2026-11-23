"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createElement, useEffect, useState } from "react";
import { cn } from "cn";
import {
  BedDouble,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FileText,
  House,
  Images,
  Link2,
  Menu,
  Newspaper,
  Presentation,
  Shirt,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { useLenis } from "lenis/react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EVENT_INFO, NAV_MENU, type NavItem, type NavMenuGroup } from "@/content/rakernas";
import { scrollToElementWhenReady } from "@/lib/scroll-to-element";

/** Waktu tunggu animasi tutup drawer sebelum menggulir (drawer mengunci scroll saat terbuka). */
const DRAWER_CLOSE_MS = 250;
const HASH_PATTERN = /^#[\w-]+$/;

const linkBase =
  "relative inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-ink transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const linkActive =
  "text-primary after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand-gold";

/**
 * @param account Slot menu akun (server).
 * @param drawerFooter Slot kartu info acara di bawah drawer HP (server, mengikuti event settings).
 */
export function SiteHeader({ account, drawerFooter }: { account?: React.ReactNode; drawerFooter?: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lenis = useLenis();
  const pathname = usePathname();
  // Anchor section (#rundown, dst.) hanya ada di beranda. Di halaman lain menu menuju
  // "/#section" lewat navigasi client-side; navbar ini tetap terpasang.
  const isHome = pathname === "/";
  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `/${href}` : href);
  const activeSection = useActiveSection(isHome);
  // Di beranda: tautan "#section" aktif saat section-nya terlihat; "Beranda" aktif bila tidak ada.
  const isActive = (href: string) =>
    href.startsWith("#")
      ? isHome && href === activeSection
      : href === pathname && !(isHome && activeSection);
  const isGroupActive = (group: NavMenuGroup) => group.children.some((child) => isActive(child.href));

  // Setelah berpindah ke "/#section" dari halaman lain (atau memuat URL ber-hash),
  // gulir ke section tersebut lewat Lenis (Lenis menahan scroll native).
  useEffect(() => {
    if (!isHome) return;
    const hash = window.location.hash;
    if (!HASH_PATTERN.test(hash)) return;
    // Konten beranda bisa baru muncul setelah navigasi: helper mencoba ulang sampai
    // section benar-benar berada di bawah navbar (scroll-mt-20 = 80px).
    return scrollToElementWhenReady({
      lenis,
      getElement: () => document.getElementById(hash.slice(1)),
      offset: 80,
    });
  }, [isHome, lenis]);

  // Drawer hanya untuk HP/tablet: tutup otomatis saat layar melebar ke desktop.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeDrawer = () => {
      if (desktop.matches) setDrawerOpen(false);
    };
    desktop.addEventListener("change", closeDrawer);
    return () => desktop.removeEventListener("change", closeDrawer);
  }, []);

  const scrollToAnchor = (href: string) => {
    const elem = document.getElementById(href.slice(1));
    if (!elem) return;
    // Lenis menghormati scroll-margin-top pada section (scroll-mt-20)
    if (lenis) lenis.scrollTo(elem, { duration: 1.2 });
    else elem.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Klik tautan menu. `delay` > 0 saat drawer sedang menutup. */
  const handleLinkClick = (event: React.MouseEvent, href: string, delay = 0) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (!isHome) return; // di halaman lain biarkan Link berpindah halaman
    const run = href.startsWith("#") ? () => scrollToAnchor(href) : href === "/" ? scrollToTop : null;
    if (!run) return;
    event.preventDefault();
    if (delay > 0) window.setTimeout(run, delay);
    else run();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between gap-3 px-4 sm:px-5 md:px-8">
        {/* Logo Kiri (Tautan ke /) */}
        <Link
          href="/"
          className="flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <nav aria-label="Navigasi utama" className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
          {NAV_MENU.map((entry) =>
            entry.children ? (
              <DesktopGroup key={entry.label} group={entry} active={isGroupActive(entry)} isActive={isActive} />
            ) : (
              <Link
                key={entry.href}
                href={resolveHref(entry.href)}
                aria-current={isActive(entry.href) ? "page" : undefined}
                className={cn(linkBase, isActive(entry.href) && linkActive)}
                onClick={(event) => handleLinkClick(event, entry.href)}
              >
                {entry.label}
              </Link>
            ),
          )}
        </nav>

        {/* Area kanan: akun + Hamburger */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Slot akun: menu profil (Profil & Logout) */}
          {account}

          {/* Drawer untuk HP dan tablet */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-lg text-ink hover:bg-secondary hover:text-primary focus-visible:ring-ring lg:hidden"
                  aria-label="Buka menu navigasi"
                />
              }
            >
              <Menu className="size-6" />
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="gap-0 overflow-hidden rounded-l-2xl border-line p-0 data-[side=right]:w-[88%] data-[side=right]:sm:max-w-sm"
            >
              <MobileDrawerBody
                footer={drawerFooter}
                resolveHref={resolveHref}
                isActive={isActive}
                isGroupActive={isGroupActive}
                onNavigate={(event, href) => {
                  setDrawerOpen(false);
                  handleLinkClick(event, href, DRAWER_CLOSE_MS);
                }}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/** Href "#section" di navbar yang dipantau scroll-spy beranda. */
const SECTION_HREFS = NAV_MENU.flatMap((entry) => (entry.children ? entry.children : [entry]))
  .map((item) => item.href)
  .filter((href) => HASH_PATTERN.test(href));
/** Garis baca di bawah navbar (64px) + scroll-mt-20; section dianggap aktif bila melintasinya. */
const SPY_LINE_PX = 96;

/** Scroll-spy: "#id" section beranda yang sedang melintasi garis baca, atau null. */
function useActiveSection(enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) {
      setActive(null);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = SECTION_HREFS.find((href) => {
        const rect = document.getElementById(href.slice(1))?.getBoundingClientRect();
        return rect && rect.top <= SPY_LINE_PX && rect.bottom > SPY_LINE_PX;
      });
      setActive(current ?? null);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);
  return active;
}

/** Ikon menu drawer, dipetakan dari href (data konten tetap bebas UI). */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/": House,
  "#rundown": CalendarClock,
  "#dresscode": Shirt,
  "/informasi-kamar-hotel": BedDouble,
  "/publikasi/foto-galeri-kegiatan": Images,
  "/publikasi/materi-presentasi-rakernas": Presentation,
  "/publikasi/notula-rapat": FileText,
};
const iconFor = (href: string) => NAV_ICONS[href] ?? Link2;

const mobileRow =
  "group/row relative flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-[15px] font-medium text-ink transition-colors hover:bg-secondary/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const mobileRowActive =
  "bg-secondary font-semibold text-primary before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-full before:bg-brand-gold";
const iconTile =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover/row:bg-background";
const iconTileActive = "bg-primary text-primary-foreground group-hover/row:bg-primary";

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

type Navigate = (event: React.MouseEvent, href: string) => void;

/** Isi drawer HP/tablet: header bermerek, daftar menu berikon, kartu info acara. */
function MobileDrawerBody({
  footer,
  resolveHref,
  isActive,
  isGroupActive,
  onNavigate,
}: {
  footer?: React.ReactNode;
  resolveHref: (href: string) => string;
  isActive: (href: string) => boolean;
  isGroupActive: (group: NavMenuGroup) => boolean;
  onNavigate: Navigate;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <>
      <SheetHeader className="relative flex-row items-center justify-between gap-3 border-b border-line bg-linear-to-br from-secondary via-background to-background px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-line">
            <Image src={EVENT_INFO.logoSrc} alt="" width={30} height={28} className="h-7 w-auto object-contain" />
          </span>
          <div className="min-w-0">
            <SheetTitle className="truncate text-base font-bold text-primary">{EVENT_INFO.name}</SheetTitle>
            <p className="truncate text-xs text-muted-foreground">Menu navigasi</p>
          </div>
        </div>
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 size-11 shrink-0 rounded-xl text-ink hover:bg-secondary hover:text-primary"
              aria-label="Tutup menu navigasi"
            />
          }
        >
          <X className="size-5" />
        </SheetClose>
        <span aria-hidden="true" className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-brand-gold/70" />
      </SheetHeader>

      <nav aria-label="Navigasi seluler" className="flex-1 overflow-y-auto px-3 pt-4 pb-3">
        <p className="px-2.5 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Menu</p>
        <motion.ul
          className="flex flex-col gap-1"
          variants={listVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="show"
        >
          {NAV_MENU.map((entry) => (
            <motion.li key={entry.label} variants={reduceMotion ? undefined : itemVariants}>
              {entry.children ? (
                <MobileGroup
                  group={entry}
                  defaultOpen={isGroupActive(entry)}
                  active={isGroupActive(entry)}
                  resolveHref={resolveHref}
                  isActive={isActive}
                  onNavigate={onNavigate}
                />
              ) : (
                <MobileLinkRow
                  href={entry.href}
                  label={entry.label}
                  resolveHref={resolveHref}
                  active={isActive(entry.href)}
                  onNavigate={onNavigate}
                />
              )}
            </motion.li>
          ))}
        </motion.ul>
      </nav>

      {footer ? (
        <div className="border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
      ) : null}
    </>
  );
}

function MobileLinkRow({
  href,
  label,
  resolveHref,
  active,
  onNavigate,
  compact = false,
}: {
  href: string;
  label: string;
  resolveHref: (href: string) => string;
  active: boolean;
  onNavigate: Navigate;
  compact?: boolean;
}) {
  return (
    <Link
      href={resolveHref(href)}
      aria-current={active ? "page" : undefined}
      onClick={(event) => onNavigate(event, href)}
      className={cn(mobileRow, compact && "min-h-11 text-sm font-normal", active && mobileRowActive)}
    >
      <span className={cn(iconTile, compact && "size-8 rounded-md bg-background", active && iconTileActive)}>
        {createElement(iconFor(href), { "aria-hidden": true, className: compact ? "size-4" : "size-[18px]" })}
      </span>
      <span className={cn("min-w-0 flex-1", compact ? "leading-snug" : "truncate")}>{label}</span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover/row:translate-x-0.5"
      />
    </Link>
  );
}

/** Menu "Publikasi" di desktop: submenu terbuka saat hover (juga klik/keyboard untuk layar sentuh). */
function DesktopGroup({
  group,
  active,
  isActive,
}: {
  group: NavMenuGroup;
  active: boolean;
  isActive: (href: string) => boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        openOnHover
        delay={80}
        closeDelay={150}
        render={
          <button
            type="button"
            className={cn(
              linkBase,
              "group/publikasi cursor-pointer gap-1 data-popup-open:bg-secondary data-popup-open:text-primary",
              active && linkActive,
            )}
          />
        }
      >
        {group.label}
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-150 group-data-popup-open/publikasi:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-72 rounded-xl border border-line bg-popover p-1.5 shadow-lg"
      >
        {group.children.map((child) => (
          <DropdownMenuItem
            key={child.href}
            render={<Link href={child.href} aria-current={isActive(child.href) ? "page" : undefined} />}
            className={cn(
              "flex min-h-11 cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors focus:bg-secondary focus:text-primary",
              isActive(child.href) && "bg-secondary font-semibold text-primary",
            )}
          >
            {child.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Menu "Publikasi" di HP/tablet: accordion di dalam drawer. */
function MobileGroup({
  group,
  defaultOpen,
  active,
  resolveHref,
  isActive,
  onNavigate,
}: {
  group: NavMenuGroup;
  defaultOpen: boolean;
  active: boolean;
  resolveHref: (href: string) => string;
  isActive: (href: string) => boolean;
  onNavigate: Navigate;
}) {
  // Terkontrol (bukan defaultValue berupa array baru tiap render, yang memicu peringatan Base UI).
  // Isi drawer di-mount ulang setiap dibuka, jadi nilai awal selalu mengikuti halaman aktif.
  const [openItems, setOpenItems] = useState<string[]>(() => (defaultOpen ? [group.label] : []));
  return (
    <Accordion value={openItems} onValueChange={setOpenItems}>
      <AccordionItem value={group.label} className="border-b-0">
        <AccordionTrigger
          className={cn(
            mobileRow,
            "items-center hover:no-underline **:data-[slot=accordion-trigger-icon]:mr-0.5",
            active && "font-semibold text-primary",
          )}
        >
          <span className={cn(iconTile, active && iconTileActive)}>
            <Newspaper aria-hidden="true" className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1 truncate">{group.label}</span>
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-1 [&_a]:no-underline [&_a]:hover:text-primary">
          <ul className="ml-6 flex flex-col gap-0.5 rounded-xl border border-line bg-muted/40 p-1.5">
            {group.children.map((child: NavItem) => (
              <li key={child.href}>
                <MobileLinkRow
                  href={child.href}
                  label={child.label}
                  resolveHref={resolveHref}
                  active={isActive(child.href)}
                  onNavigate={onNavigate}
                  compact
                />
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
