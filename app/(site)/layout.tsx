import { Suspense } from "react";
import { SiteHeader } from "@/components/rakernas/site-header";
import { DrawerEventCard } from "@/components/rakernas/drawer-event-card";
import { WhatsAppFloatSlot } from "@/components/rakernas/whatsapp-float-slot";
import { ScrollToTop } from "@/components/rakernas/scroll-to-top";
import { AccountMenu, LoginLink } from "@/components/auth/account-menu";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { getEventSettings } from "@/lib/event-settings-server";
import { getMyQrToken } from "@/lib/my-qr-token";

/**
 * Shared layout untuk situs publik (Beranda "/").
 * Layout tetap terpasang saat berpindah halaman (partial rendering), jadi navbar
 * tidak di-remount dan hanya isi halaman (page.tsx) yang berganti.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* S0 — Header (Sticky), dipakai bersama oleh seluruh halaman publik */}
        <SiteHeader
          account={
            <Suspense fallback={<LoginLink />}>
              <AccountMenu />
            </Suspense>
          }
          qrToken={getMyQrToken()}
          panitiaUrl={getEventSettings().then((settings) => settings.footerUrl)}
          sheetFooter={
            <Suspense fallback={null}>
              <DrawerEventCard />
            </Suspense>
          }
        />
        {children}
        {/* Tombol kembali ke atas, muncul saat mendekati dasar halaman (di atas popup WhatsApp) */}
        <ScrollToTop />
        {/* Popup WhatsApp ter-pin kanan bawah; tautan mengikuti footer_url event settings */}
        <Suspense fallback={null}>
          <WhatsAppFloatSlot />
        </Suspense>
      </div>
    </SmoothScroll>
  );
}
