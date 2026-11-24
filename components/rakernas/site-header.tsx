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
  LayoutGrid,
  Link2,
  Presentation,
  Shirt,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { useLenis } from "lenis/react";
import { Button } from "@/components/ui/button";
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
import {
  EVENT_INFO,
  NAV_MENU,
  type NavItem,
  type NavMenuGroup,
} from "@/content/rakernas";
import { scrollToElementWhenReady } from "@/lib/scroll-to-element";

/** Waktu tunggu animasi tutup sheet sebelum menggulir (sheet mengunci scroll saat terbuka). */
const SHEET_CLOSE_MS = 250;
const HASH_PATTERN = /^#[\w-]+$/;

const linkBase =
  "relative inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-ink transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const linkActive =
  "text-primary after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand-gold";

/** Halaman yang tidak menampilkan navbar: /form dibuka peserta lewat link broadcast. */
const HIDDEN_ON = new Set(["/form"]);

/**
 * Navbar situs publik.
 * - Desktop (lg+): menu di tengah bar atas, "Publikasi" berupa dropdown hover.
 * - HP/tablet (< lg): bar atas tipis (logo + akun) dan tab bar di bawah layar; grup menu
 *   (Publikasi) dibuka dari tab "Lainnya" sebagai sheet dari bawah.
 * @param account Slot menu akun (server).
 * @param sheetFooter Slot kartu info acara di bawah sheet "Lainnya" (server, mengikuti event settings).
 */
export function SiteHeader({
  account,
  sheetFooter,
}: {
  account?: React.ReactNode;
  sheetFooter?: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const lenis = useLenis();
  const pathname = usePathname();
  // Anchor section (#rundown, dst.) hanya ada di beranda. Di halaman lain menu menuju
  // "/#section" lewat navigasi client-side; navbar ini tetap terpasang.
  const isHome = pathname === "/";
  const resolveHref = (href: string) =>
    href.startsWith("#") && !isHome ? `/${href}` : href;
  const activeSection = useActiveSection(isHome);
  // Di beranda: tautan "#section" aktif saat section-nya terlihat; "Beranda" aktif bila tidak ada.
  const isActive = (href: string) =>
    href.startsWith("#")
      ? isHome && href === activeSection
      : href === pathname && !(isHome && activeSection);
  const isGroupActive = (group: NavMenuGroup) =>
    group.children.some((child) => isActive(child.href));

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

  // Sheet "Lainnya" hanya untuk HP/tablet: tutup otomatis saat layar melebar ke desktop.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeSheet = () => {
      if (desktop.matches) setMoreOpen(false);
    };
    desktop.addEventListener("change", closeSheet);
    return () => desktop.removeEventListener("change", closeSheet);
  }, []);

  // Halaman publik tanpa navbar (setelah semua hook agar urutan hook tetap sama).
  if (HIDDEN_ON.has(pathname)) return null;

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

  /** Klik tautan menu. `delay` > 0 saat sheet sedang menutup. */
  const handleLinkClick = (
    event: React.MouseEvent,
    href: string,
    delay = 0,
  ) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
      return;
    if (!isHome) return; // di halaman lain biarkan Link berpindah halaman
    const run = href.startsWith("#")
      ? () => scrollToAnchor(href)
      : href === "/"
        ? scrollToTop
        : null;
    if (!run) return;
    event.preventDefault();
    if (delay > 0) window.setTimeout(run, delay);
    else run();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-3 px-4 sm:px-5 md:px-8 lg:h-16">
          {/* Logo Kiri (Tautan ke /); nama acara hanya di HP/tablet karena desktop memuat menu */}
          <Link
            href="/"
            className="flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={EVENT_INFO.name}
            onClick={(event) => handleLinkClick(event, "/")}
          >
            <Image
              src={EVENT_INFO.logoSrc}
              alt={EVENT_INFO.logoAlt}
              width={38}
              height={36}
              priority
              className="h-8 w-auto object-contain lg:h-9"
            />
            <span
              aria-hidden="true"
              className="flex flex-col leading-none max-[359px]:hidden lg:hidden"
            >
              <span className="font-heading text-[15px] font-bold text-primary">
                {EVENT_INFO.name}
              </span>
              <span className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-brand-gold-text uppercase">
                Rapat Kerja Nasional
              </span>
            </span>
          </Link>

          {/* Navigasi langsung pada laptop dan desktop */}
          <nav
            aria-label="Navigasi utama"
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1"
          >
            {NAV_MENU.map((entry) =>
              entry.children ? (
                <DesktopGroup
                  key={entry.label}
                  group={entry}
                  active={isGroupActive(entry)}
                  isActive={isActive}
                />
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

          {/* Slot akun (server): tombol akun atau menu profil */}
          <div className="flex shrink-0 items-center">{account}</div>
        </div>
      </header>

      {/* Di luar <header>: backdrop-blur pada header menjadi containing block bagi elemen fixed. */}
      <MobileTabBar
        isActive={isActive}
        isGroupActive={isGroupActive}
        resolveHref={resolveHref}
        onNavigate={handleLinkClick}
        moreOpen={moreOpen}
        onMoreOpenChange={setMoreOpen}
        sheetFooter={sheetFooter}
      />
    </>
  );
}

/** Href "#section" di navbar yang dipantau scroll-spy beranda. */
const SECTION_HREFS = NAV_MENU.flatMap((entry) =>
  entry.children ? entry.children : [entry],
)
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
        const rect = document
          .getElementById(href.slice(1))
          ?.getBoundingClientRect();
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

/** Ikon menu HP, dipetakan dari href (data konten tetap bebas UI). */
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

/** Label pendek untuk tab bar HP (label lengkap tetap dipakai sebagai aria-label). */
const TAB_LABELS: Record<string, string> = {
  "/informasi-kamar-hotel": "Hotel",
  "#rundown": "Rundown",
};

/** Tab langsung = menu tanpa submenu; grup (Publikasi) dibuka lewat tab "Lainnya". */
const TAB_ITEMS = NAV_MENU.filter((entry): entry is NavItem => !entry.children);
const MORE_GROUPS = NAV_MENU.filter(
  (entry): entry is NavMenuGroup => !!entry.children,
);

type Navigate = (event: React.MouseEvent, href: string, delay?: number) => void;

const tabBase =
  "group/tab relative flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[11px] leading-none font-medium max-[359px]:text-[10px] max-[359px]:tracking-tight text-ink-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Ikon tab dengan pil penanda yang bergeser ke tab aktif. */
function TabIcon({
  icon,
  active,
  reduceMotion,
}: {
  icon: LucideIcon;
  active: boolean;
  reduceMotion: boolean;
}) {
  return (
    <span className="relative flex h-8 w-12 items-center justify-center sm:w-14">
      {active && (
        <motion.span
          layoutId="mobile-tab-pill"
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-secondary"
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 40 }
          }
        />
      )}
      {createElement(icon, {
        "aria-hidden": true,
        className: cn(
          "relative size-[22px] transition-transform group-active/tab:scale-90",
          active && "text-primary",
        ),
        strokeWidth: active ? 2.25 : 1.9,
      })}
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-1.5 size-1.5 rounded-full bg-brand-gold ring-2 ring-background"
        />
      )}
    </span>
  );
}

const sheetListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
};
const sheetItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Tab bar bawah untuk HP/tablet: menempel di HP, kapsul melayang mulai sm. */
function MobileTabBar({
  isActive,
  isGroupActive,
  resolveHref,
  onNavigate,
  moreOpen,
  onMoreOpenChange,
  sheetFooter,
}: {
  isActive: (href: string) => boolean;
  isGroupActive: (group: NavMenuGroup) => boolean;
  resolveHref: (href: string) => string;
  onNavigate: Navigate;
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
  sheetFooter?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const moreActive = MORE_GROUPS.some(isGroupActive);

  return (
    <nav
      data-bottom-nav
      aria-label="Navigasi seluler"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:bottom-4 sm:px-4 lg:hidden"
    >
      <Sheet open={moreOpen} onOpenChange={onMoreOpenChange}>
        <ul className="pointer-events-auto mx-auto flex items-stretch gap-0.5 rounded-t-2xl border-t border-line bg-background/95 px-1.5 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-18px_rgb(9_80_70/0.45)] backdrop-blur-md sm:max-w-md sm:rounded-full sm:border sm:px-2 sm:pb-1 sm:shadow-xl sm:shadow-brand-green-deep/15">
          {TAB_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex min-w-0 flex-1">
                <Link
                  href={resolveHref(item.href)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => onNavigate(event, item.href)}
                  className={cn(
                    tabBase,
                    active && "font-semibold text-primary",
                  )}
                >
                  <TabIcon
                    icon={iconFor(item.href)}
                    active={active}
                    reduceMotion={reduceMotion}
                  />
                  <span className="max-w-full truncate">
                    {TAB_LABELS[item.href] ?? item.label}
                  </span>
                </Link>
              </li>
            );
          })}
          {MORE_GROUPS.length > 0 && (
            <li className="flex min-w-0 flex-1">
              <SheetTrigger
                aria-label={`Lainnya: ${MORE_GROUPS.map((g) => g.label).join(", ")}`}
                className={cn(
                  tabBase,
                  (moreActive || moreOpen) && "font-semibold text-primary",
                )}
              >
                <TabIcon
                  icon={LayoutGrid}
                  active={moreActive}
                  reduceMotion={reduceMotion}
                />
                <span className="max-w-full truncate">Lainnya</span>
              </SheetTrigger>
            </li>
          )}
        </ul>

        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[85dvh] gap-0 overflow-hidden rounded-t-3xl border-line p-0 sm:mx-auto sm:max-w-md"
        >
          <span
            aria-hidden="true"
            className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line"
          />
          <SheetHeader className="flex-row items-center justify-between gap-3 px-5 pt-3 pb-2">
            <SheetTitle className="font-heading text-lg font-bold text-primary">
              Menu Lainnya
            </SheetTitle>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 size-11 shrink-0 rounded-full text-ink hover:bg-secondary hover:text-primary"
                  aria-label="Tutup menu lainnya"
                />
              }
            >
              <X className="size-5" />
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 pb-3" data-lenis-prevent>
            {MORE_GROUPS.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <p className="px-2.5 pt-1 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {group.label}
                </p>
                <motion.ul
                  className="flex flex-col gap-1"
                  variants={sheetListVariants}
                  initial={reduceMotion ? false : "hidden"}
                  animate="show"
                >
                  {group.children.map((child) => {
                    const active = isActive(child.href);
                    return (
                      <motion.li
                        key={child.href}
                        variants={reduceMotion ? undefined : sheetItemVariants}
                      >
                        <Link
                          href={resolveHref(child.href)}
                          aria-current={active ? "page" : undefined}
                          onClick={(event) => {
                            onMoreOpenChange(false);
                            onNavigate(event, child.href, SHEET_CLOSE_MS);
                          }}
                          className={cn(
                            "group/row flex min-h-14 items-center gap-3 rounded-2xl px-2.5 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-secondary/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active && "bg-secondary font-semibold text-primary",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover/row:bg-background",
                              active &&
                                "bg-primary text-primary-foreground group-hover/row:bg-primary",
                            )}
                          >
                            {createElement(iconFor(child.href), {
                              "aria-hidden": true,
                              className: "size-5",
                            })}
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">
                            {child.label}
                          </span>
                          <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover/row:translate-x-0.5"
                          />
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </section>
            ))}
          </div>

          {sheetFooter ? (
            <div className="border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {sheetFooter}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </nav>
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
            render={
              <Link
                href={child.href}
                aria-current={isActive(child.href) ? "page" : undefined}
              />
            }
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
