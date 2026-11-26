"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createElement, useEffect, useRef, useState } from "react";
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
import { FloatingCapsuleNav } from "@/components/floating-capsule-nav";
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
  "relative z-[1] inline-flex h-10 items-center whitespace-nowrap isolate rounded-full px-3.5 text-sm font-medium text-ink transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const linkActive =
  "font-semibold text-primary-foreground hover:text-primary-foreground";

/** Pil hijau item aktif navbar desktop; layoutId membuatnya meluncur antar item saat aktif berpindah. */
function ActiveNavPill() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      layoutId="desktop-nav-active"
      aria-hidden="true"
      className="absolute inset-0 -z-10 rounded-full bg-primary"
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
    />
  );
}

/** Halaman yang tidak menampilkan navbar: /form dibuka peserta lewat link broadcast. */
const HIDDEN_ON = new Set(["/form", "/form-data-direksi"]);

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
  const hoverPill = useRef<HTMLSpanElement>(null);
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

  /** Pil hover geser: ikuti item di bawah kursor/fokus, kecuali item aktif (sudah berpil solid). */
  const moveHoverPill = (target: EventTarget | null) => {
    const pill = hoverPill.current;
    if (!pill) return;
    const item =
      target instanceof Element
        ? target.closest<HTMLElement>("[data-nav-item]")
        : null;
    if (!item || item.dataset.active !== undefined) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = `${item.offsetWidth}px`;
    pill.style.transform = `translateX(${item.offsetLeft}px)`;
  };

  return (
    <>
      <FloatingCapsuleNav
        actions={account}
        brand={
          /* Logo kiri (tautan ke /); logo sudah memuat nama acara */
          <Link
            href="/"
            className="flex min-h-11 min-w-11 shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={EVENT_INFO.name}
            onClick={(event) => handleLinkClick(event, "/")}
          >
            {/* HP: logo ikon saja; ≥640px: logo lengkap */}
            <Image
              src="/logo-rakernas-mark.png"
              alt={EVENT_INFO.logoAlt}
              width={240}
              height={256}
              priority
              className="h-10 w-auto object-contain sm:hidden"
            />
            <Image
              src={EVENT_INFO.logoSrc}
              alt={EVENT_INFO.logoAlt}
              width={600}
              height={223}
              priority
              className="hidden h-9 w-auto object-contain sm:block lg:h-10"
            />
          </Link>
        }
      >
        {/* Navigasi langsung pada laptop dan desktop */}
        <motion.nav
          layoutRoot
          aria-label="Navigasi utama"
          className="relative flex items-center gap-0.5 xl:gap-1"
          onPointerOver={(event) => moveHoverPill(event.target)}
          onPointerLeave={() => moveHoverPill(null)}
          onFocus={(event) => moveHoverPill(event.target)}
          onBlur={() => moveHoverPill(null)}
        >
          <span
            ref={hoverPill}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-0 h-10 -translate-y-1/2 rounded-full bg-secondary opacity-0 transition-[transform,width,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          />
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
                data-nav-item=""
                data-active={isActive(entry.href) ? "" : undefined}
                className={cn(linkBase, isActive(entry.href) && linkActive)}
                onClick={(event) => handleLinkClick(event, entry.href)}
              >
                {isActive(entry.href) && <ActiveNavPill />}
                {entry.label}
              </Link>
            ),
          )}
        </motion.nav>
      </FloatingCapsuleNav>

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
  "group/tab relative isolate flex min-h-12 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] px-2 py-1.5 text-[11px] leading-none font-medium max-[359px]:px-1 max-[359px]:text-[10px] max-[359px]:tracking-tight text-[#4F7A72] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Isi tab: pil gradien hijau (bergeser antar tab) di belakang ikon + label saat aktif. */
function TabContent({
  icon,
  label,
  active,
  reduceMotion,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  reduceMotion: boolean;
}) {
  return (
    <>
      {active && (
        <motion.span
          layoutId="mobile-tab-pill"
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-[14px] bg-linear-to-b from-[#0B6355] to-[#04362F] shadow-[0_6px_16px_#09504640,inset_0_1px_0_#FFFFFF33]"
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
          "size-5 transition-transform group-active/tab:scale-90",
          active && "text-white",
        ),
        strokeWidth: active ? 2.25 : 1.9,
      })}
      <span className={cn("max-w-full truncate", active && "text-white")}>{label}</span>
    </>
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

/** Garis tepi gradien (putih ke hijau transparan) untuk permukaan kaca. */
const glassEdge =
  "pointer-events-none absolute inset-0 border border-transparent [mask:linear-gradient(#000_0_0)_padding-box_exclude,linear-gradient(#000_0_0)_border-box]";

/** Tab bar bawah HP/tablet: kapsul kaca melayang. */
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
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 px-3 sm:bottom-4 lg:hidden"
    >
      <Sheet open={moreOpen} onOpenChange={onMoreOpenChange}>
        <ul className="pointer-events-auto relative mx-auto flex max-w-[340px] items-center justify-around gap-0.5 rounded-[28px] bg-white/80 bg-linear-to-b from-white/50 via-white/0 via-60% to-white/0 p-2 shadow-[0_8px_24px_#04362F14,inset_0_1px_0_#FFFFFFE6] backdrop-blur-[24px] backdrop-saturate-150 sm:max-w-sm">
          <span
            aria-hidden="true"
            className={cn(glassEdge, "rounded-[28px] [background:linear-gradient(to_bottom,#FFFFFF,#09504626)_border-box]")}
          />
          {TAB_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex min-w-0">
                <Link
                  href={resolveHref(item.href)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => onNavigate(event, item.href)}
                  className={cn(tabBase, active && "font-semibold")}
                >
                  <TabContent
                    icon={iconFor(item.href)}
                    label={TAB_LABELS[item.href] ?? item.label}
                    active={active}
                    reduceMotion={reduceMotion}
                  />
                </Link>
              </li>
            );
          })}
          {MORE_GROUPS.length > 0 && (
            <li className="flex min-w-0">
              <SheetTrigger
                aria-label={`Lainnya: ${MORE_GROUPS.map((g) => g.label).join(", ")}`}
                className={cn(
                  tabBase,
                  (moreActive || moreOpen) && "font-semibold",
                  moreOpen && !moreActive && "text-primary",
                )}
              >
                <TabContent
                  icon={LayoutGrid}
                  label="Lainnya"
                  active={moreActive}
                  reduceMotion={reduceMotion}
                />
              </SheetTrigger>
            </li>
          )}
        </ul>

        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[85dvh] gap-0 overflow-hidden rounded-t-[28px] border-0 bg-white/72 bg-linear-to-b from-white/60 via-white/0 via-35% to-white/0 p-0 shadow-[0_-8px_40px_#04363029,inset_0_1px_0_#FFFFFFF2] backdrop-blur-[32px] backdrop-saturate-150 sm:mx-auto sm:max-w-md"
        >
          <span
            aria-hidden="true"
            className={cn(glassEdge, "rounded-t-[28px] [background:linear-gradient(to_bottom,#FFFFFF,#FFFFFF33)_border-box]")}
          />
          <div className="flex justify-center pt-2.5 pb-1">
            <span aria-hidden="true" className="h-[5px] w-10 shrink-0 rounded-[3px] bg-[#04362F33]" />
          </div>
          <SheetHeader className="flex-row items-center justify-between gap-3 px-6 pt-4 pb-2">
            <SheetTitle className="font-heading text-[22px] font-bold text-primary">
              Menu Lainnya
            </SheetTitle>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 rounded-full border border-white bg-white/60 text-primary hover:bg-white hover:text-primary"
                  aria-label="Tutup menu lainnya"
                />
              }
            >
              <X className="size-[22px]" />
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4" data-lenis-prevent>
            {MORE_GROUPS.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <p className="px-2 pt-1 pb-2 text-xs font-bold tracking-[2px] text-[#4F7A72] uppercase">
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
                            "group/row flex items-center gap-4 rounded-2xl border border-white/90 bg-white/55 px-2 py-2.5 text-[17px] font-medium text-[#073B33] shadow-[0_2px_8px_#04362F0D] transition-colors hover:bg-white/85 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active && "bg-white/90 font-semibold text-primary ring-1 ring-primary/25",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-12 shrink-0 items-center justify-center rounded-full bg-[#EEF8F3E6] text-primary",
                              active && "bg-primary text-primary-foreground",
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
                            className="size-[18px] shrink-0 text-[#4F7A72] transition-transform group-hover/row:translate-x-0.5"
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
            <div className="border-t border-[#04362F1A] px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
            data-nav-item=""
            data-active={active ? "" : undefined}
            className={cn(
              linkBase,
              "group/publikasi cursor-pointer gap-1",
              active ? linkActive : "data-popup-open:text-primary",
            )}
          />
        }
      >
        {active && <ActiveNavPill />}
        {group.label}
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-150 group-data-popup-open/publikasi:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="hidden w-80 rounded-[20px] border border-line bg-popover p-2 shadow-xl shadow-brand-green-deep/10 ring-0 lg:block"
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
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary not-data-[variant=destructive]:focus:**:text-primary data-highlighted:bg-secondary data-highlighted:text-primary",
              isActive(child.href) && "bg-secondary font-semibold text-primary",
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"
            >
              {createElement(iconFor(child.href), { className: "size-[18px]" })}
            </span>
            <span className="min-w-0 flex-1 whitespace-nowrap leading-snug">
              {child.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
