"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
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
import {
  keyForHref,
  resolveSpyKey,
  TOP_THRESHOLD_PX,
  type NavKey,
} from "@/lib/nav-active-key";

const HASH_PATTERN = /^#[\w-]+$/;
const HOME_LINK = "/#top";
const navHref = (href: string) => {
  if (href === "/") return HOME_LINK;
  return href.startsWith("#") ? `/${href}` : href;
};

const linkBase =
  "relative z-[1] inline-flex h-10 items-center gap-2 whitespace-nowrap isolate rounded-full px-3.5 text-sm font-medium text-[#073B33] xl:h-11 xl:px-4 xl:text-[15px] transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const linkActive =
  "font-semibold text-primary-foreground hover:text-primary-foreground";

/** Kelas bersama indikator aktif geser; transisi baru aktif setelah penempatan pertama (data-ready). */
const indicatorBase =
  "pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 bg-linear-to-b from-[#0B6355] to-[#04362F] opacity-0 data-ready:transition-[transform,width,opacity] data-ready:duration-300 data-ready:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/** Titik emas penanda item aktif navbar desktop. */
function ActiveDot() {
  return <span aria-hidden="true" className="-ml-0.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />;
}

/** Halaman yang tidak menampilkan navbar: /form dibuka peserta lewat link broadcast. */
const HIDDEN_ON = new Set(["/form", "/form-data-direksi"]);

/**
 * Navbar situs publik.
 * - Desktop (lg+): menu di tengah bar atas, "Publikasi" berupa dropdown hover.
 * - HP/tablet (< lg): kapsul atas (logo + akun) dan tab bar di bawah layar; grup menu
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
  const { activeKey, select } = useNavActiveKey(pathname, lenis);
  const { containerRef: desktopNavRef, indicatorRef: desktopPillRef } =
    useSlidingIndicator<HTMLElement>(activeKey);

  // Sheet "Lainnya" hanya untuk HP/tablet: tutup otomatis saat layar melebar ke desktop.
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeSheet = () => {
      if (desktopQuery.matches) setMoreOpen(false);
    };
    desktopQuery.addEventListener("change", closeSheet);
    return () => desktopQuery.removeEventListener("change", closeSheet);
  }, []);

  // Halaman publik tanpa navbar (setelah semua hook agar urutan hook tetap sama).
  if (HIDDEN_ON.has(pathname)) return null;

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
            href={HOME_LINK}
            onNavigate={() => select("beranda")}
            className="flex min-h-11 min-w-11 shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={EVENT_INFO.name}
          >
            <Image
              src={EVENT_INFO.logoSrc}
              alt={EVENT_INFO.logoAlt}
              width={600}
              height={223}
              priority
              className="h-[30px] w-auto object-contain sm:h-9 lg:h-10"
            />
          </Link>
        }
      >
        {/* Navigasi langsung pada laptop dan desktop */}
        <nav
          ref={desktopNavRef}
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
          <span
            ref={desktopPillRef}
            aria-hidden="true"
            className={cn(indicatorBase, "h-10 rounded-full shadow-[0_4px_14px_#09504633,inset_0_1px_0_#FFFFFF33] xl:h-11")}
          />
          {NAV_MENU.map((entry) => {
            if (entry.children) {
              return (
                <DesktopGroup
                  key={entry.label}
                  group={entry}
                  active={activeKey === "publikasi"}
                  pathname={pathname}
                  onSelect={select}
                />
              );
            }
            const key = keyForHref(entry.href);
            const active = key !== null && activeKey === key;
            return (
              <Link
                key={entry.href}
                href={navHref(entry.href)}
                onNavigate={() => key && select(key)}
                aria-current={active ? "page" : undefined}
                data-nav-item=""
                data-nav-key={key ?? undefined}
                data-active={active ? "" : undefined}
                className={cn(linkBase, active && linkActive)}
              >
                {active && <ActiveDot />}
                {entry.label}
              </Link>
            );
          })}
        </nav>
      </FloatingCapsuleNav>

      {/* Di luar <header>: backdrop-blur pada header menjadi containing block bagi elemen fixed. */}
      <MobileTabBar
        activeKey={activeKey}
        pathname={pathname}
        onSelect={select}
        moreOpen={moreOpen}
        onMoreOpenChange={setMoreOpen}
        sheetFooter={sheetFooter}
      />
    </>
  );
}

/** Section beranda yang dipantau scroll-spy (id = href tanpa "#"). */
const SPY_SECTIONS = NAV_MENU.flatMap((entry) =>
  entry.children ? entry.children : [entry],
)
  .map((item) => item.href)
  .filter((href) => HASH_PATTERN.test(href))
  .map((href) => ({ id: href.slice(1), key: keyForHref(href) }))
  .filter((section): section is { id: string; key: NavKey } => section.key !== null);
/** Garis baca di bawah navbar (64px) + scroll-mt-20; section dianggap aktif bila melintasinya. */
const SPY_LINE_PX = 96;
/** Batas waktu cadangan kunci scroll-spy setelah klik (navigasi lintas halaman + gulir Lenis). */
const PENDING_TIMEOUT_MS = 4000;

const isSectionKey = (key: NavKey | null): key is NavKey =>
  SPY_SECTIONS.some((section) => section.key === key);
const keyForHash = (hash: string) =>
  HASH_PATTERN.test(hash) ? keyForHref(hash) : null;

/**
 * Satu sumber kebenaran item aktif navbar.
 * - Halaman selain "/": dari pathname.
 * - "/": target tertunda (klik/hash URL) bila ada, selain itu scroll-spy.
 * Klik langsung mengunci target (optimistic) sehingga scroll-spy tidak bisa menimpanya
 * sampai section tujuan tercapai, pengguna menggulir sendiri, atau batas waktu habis.
 * SiteHeader ada di layout bersama, jadi target tetap terjaga saat pindah halaman.
 */
function useNavActiveKey(pathname: string, lenis: Lenis | undefined) {
  const isHome = pathname === "/";
  const [spyKey, setSpyKey] = useState<NavKey>("beranda");
  const [pending, setPending] = useState<NavKey | null>(null);
  const pendingRef = useRef<NavKey | null>(null);

  const select = useCallback((key: NavKey) => {
    pendingRef.current = key;
    setPending(key);
  }, []);
  const release = useCallback((key: NavKey) => {
    if (pendingRef.current !== key) return;
    pendingRef.current = null;
    setSpyKey(key);
    setPending(null);
  }, []);

  // Saat tiba di "/" (refresh, URL ber-hash, atau dari halaman lain): kunci ke hash sebelum paint
  // agar indikator tidak singgah di Beranda, lalu gulir ke section-nya lewat Lenis.
  useLayoutEffect(() => {
    if (!isHome) return;
    const hashKey = keyForHash(window.location.hash);
    // Sinkron dari URL (sistem eksternal) sebelum paint; hash tidak tersedia saat render server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hashKey && hashKey !== "beranda") select(hashKey);
    const target = pendingRef.current;
    if (!isSectionKey(target)) return;
    return scrollToElementWhenReady({
      lenis,
      getElement: () => document.getElementById(target),
      offset: 80,
      tolerance: 8,
      // URL ber-hash bisa baru diperbarui sesaat setelah navigasi; target klik tetap berlaku.
      enabled: () =>
        pendingRef.current === target || keyForHash(window.location.hash) === target,
      onReach: () => release(target),
    });
  }, [isHome, lenis, select, release]);

  // Back/forward ke "/#section": kunci ke hash tujuan agar tidak berkedip saat scroll dipulihkan.
  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname !== "/") return;
      const hashKey = keyForHash(window.location.hash);
      if (hashKey) select(hashKey);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [select]);

  // Kunci aktif: lepas saat batas waktu habis atau pengguna menggulir sendiri.
  useEffect(() => {
    if (!pending) return;
    const releasePending = () => release(pending);
    const timer = window.setTimeout(releasePending, PENDING_TIMEOUT_MS);
    window.addEventListener("wheel", releasePending, { passive: true });
    window.addEventListener("touchmove", releasePending, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("wheel", releasePending);
      window.removeEventListener("touchmove", releasePending);
    };
  }, [pending, release]);

  // Scroll-spy beranda. Selama terkunci, hanya memeriksa apakah target sudah tercapai.
  useEffect(() => {
    if (!isHome) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const sectionKey =
        SPY_SECTIONS.find(({ id }) => {
          const rect = document.getElementById(id)?.getBoundingClientRect();
          return rect && rect.top <= SPY_LINE_PX && rect.bottom > SPY_LINE_PX;
        })?.key ?? null;
      const target = pendingRef.current;
      if (target) {
        const reached =
          target === sectionKey ||
          (target === "beranda" && window.scrollY < TOP_THRESHOLD_PX);
        if (reached) release(target);
        return;
      }
      setSpyKey((previous) =>
        resolveSpyKey({ sectionKey, scrollY: window.scrollY, previous }),
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isHome, pending, release]);

  const activeKey: NavKey | null = isHome
    ? (pending ?? spyKey)
    : keyForHref(pathname);
  return { activeKey, select };
}

/**
 * Satu indikator absolut yang meluncur ke item `[data-nav-key=activeKey]` di dalam container
 * (translateX + width). Penempatan pertama tanpa animasi; diukur ulang saat ukuran item
 * berubah (resize, font selesai dimuat, teks aktif menebal).
 */
function useSlidingIndicator<T extends HTMLElement>(activeKey: NavKey | null) {
  const containerRef = useRef<T>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const pill = indicatorRef.current;
    if (!container || !pill) return;
    const place = () => {
      const item = activeKey
        ? container.querySelector<HTMLElement>(`[data-nav-key="${activeKey}"]`)
        : null;
      if (!item) {
        pill.style.opacity = "0";
        return;
      }
      pill.style.opacity = "1";
      pill.style.width = `${item.offsetWidth}px`;
      pill.style.transform = `translateX(${item.offsetLeft}px)`;
    };
    place();
    const frame = window.requestAnimationFrame(() => {
      pill.dataset.ready = "";
    });
    const observer = new ResizeObserver(place);
    observer.observe(container);
    container
      .querySelectorAll("[data-nav-key]")
      .forEach((item) => observer.observe(item));
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (alive) place();
    });
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeKey]);
  return { containerRef, indicatorRef };
}

/** Ikon menu HP, dipetakan dari href (data konten tetap bebas UI). */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/": House,
  "#rundown": CalendarClock,
  "#dresscode": Shirt,
  "/informasi-kamar-hotel": BedDouble,
  "/profile": UserRound,
  "/publikasi/foto-galeri-kegiatan": Images,
  "/publikasi/materi-presentasi-rakernas": Presentation,
  "/publikasi/notula-rapat": FileText,
};
const iconFor = (href: string) => NAV_ICONS[href] ?? Link2;

/** Tab bar HP (ikon saja): dua tab kiri, tombol "Lainnya" di tengah, dua tab kanan. */
const NAV_ITEMS = NAV_MENU.filter((entry): entry is NavItem => !entry.children);
const tabItem = (href: string, label?: string): NavItem => ({
  href,
  label: label ?? NAV_ITEMS.find((item) => item.href === href)?.label ?? href,
});
const TABS_LEFT = [tabItem("/"), tabItem("#rundown")];
const TABS_RIGHT = [tabItem("/informasi-kamar-hotel"), tabItem("/profile", "Profil Saya")];
const MORE_GROUPS = NAV_MENU.filter(
  (entry): entry is NavMenuGroup => !!entry.children,
);

const tabBase =
  "group/tab relative isolate flex size-11 cursor-pointer items-center justify-center rounded-[14px] text-[#4F7A72] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Ikon tab; putih di atas indikator geser saat aktif. */
function TabIcon({ icon, active }: { icon: LucideIcon; active: boolean }) {
  return createElement(icon, {
    "aria-hidden": true,
    className: cn(
      "size-[22px] transition-transform group-active/tab:scale-90",
      active && "text-white",
    ),
    strokeWidth: active ? 2.25 : 1.9,
  });
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
  activeKey,
  pathname,
  onSelect,
  moreOpen,
  onMoreOpenChange,
  sheetFooter,
}: {
  activeKey: NavKey | null;
  pathname: string;
  onSelect: (key: NavKey) => void;
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
  sheetFooter?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { containerRef: tabsRef, indicatorRef: tabsPillRef } =
    useSlidingIndicator<HTMLUListElement>(activeKey);
  const renderTab = (item: NavItem) => {
    const key = keyForHref(item.href);
    const active = key !== null && activeKey === key;
    return (
      <li key={item.href} className="flex">
        <Link
          href={navHref(item.href)}
          onNavigate={() => key && onSelect(key)}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
          data-nav-key={key ?? undefined}
          className={tabBase}
        >
          <TabIcon icon={iconFor(item.href)} active={active} />
        </Link>
      </li>
    );
  };

  return (
    <nav
      data-bottom-nav
      aria-label="Navigasi seluler"
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 px-4 sm:bottom-4 min-[760px]:px-6 lg:hidden"
    >
      <Sheet open={moreOpen} onOpenChange={onMoreOpenChange}>
        <ul
          ref={tabsRef}
          className="pointer-events-auto relative mx-auto flex h-[60px] items-center justify-between rounded-[28px] bg-white/80 bg-linear-to-b from-white/50 via-white/0 via-60% to-white/0 p-2 shadow-[0_8px_24px_#04362F14,inset_0_1px_0_#FFFFFFE6] backdrop-blur-[24px] backdrop-saturate-150 px-3.5"
        >
          <span
            aria-hidden="true"
            className={cn(glassEdge, "rounded-[28px] [background:linear-gradient(to_bottom,#FFFFFF,#09504626)_border-box]")}
          />
          <span
            ref={tabsPillRef}
            aria-hidden="true"
            className={cn(indicatorBase, "h-11 rounded-[14px] shadow-[0_6px_16px_#09504640,inset_0_1px_0_#FFFFFF33]")}
          />
          {TABS_LEFT.map(renderTab)}
          <li className="relative flex h-11 w-16 justify-center">
            <SheetTrigger
              aria-label={`Lainnya: ${MORE_GROUPS.map((g) => g.label).join(", ")}`}
              className={cn(
                "absolute -top-[26px] flex size-16 cursor-pointer items-center justify-center rounded-full border border-white/90 bg-linear-to-b from-[#0B6355] to-[#04362F] bg-clip-padding text-white shadow-[0_0_0_5px_#FFFFFF99,0_0_0_6px_#09504614,0_10px_24px_#09504659,inset_0_1px_0_#FFFFFF40] transition-transform hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-ring",
              )}
            >
              <LayoutGrid aria-hidden="true" className="size-[26px]" strokeWidth={2} />
            </SheetTrigger>
          </li>
          {TABS_RIGHT.map(renderTab)}
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
                    const active = pathname === child.href;
                    const key = keyForHref(child.href);
                    return (
                      <motion.li
                        key={child.href}
                        variants={reduceMotion ? undefined : sheetItemVariants}
                      >
                        <Link
                          href={navHref(child.href)}
                          aria-current={active ? "page" : undefined}
                          onNavigate={() => {
                            if (key) onSelect(key);
                            onMoreOpenChange(false);
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
  pathname,
  onSelect,
}: {
  group: NavMenuGroup;
  active: boolean;
  pathname: string;
  onSelect: (key: NavKey) => void;
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
            data-nav-key="publikasi"
            data-active={active ? "" : undefined}
            className={cn(
              linkBase,
              "group/publikasi cursor-pointer gap-1",
              active ? linkActive : "data-popup-open:text-primary",
            )}
          />
        }
      >
        {active && <ActiveDot />}
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
                href={navHref(child.href)}
                onNavigate={() => onSelect("publikasi")}
                aria-current={pathname === child.href ? "page" : undefined}
              />
            }
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary not-data-[variant=destructive]:focus:**:text-primary data-highlighted:bg-secondary data-highlighted:text-primary",
              pathname === child.href && "bg-secondary font-semibold text-primary",
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
