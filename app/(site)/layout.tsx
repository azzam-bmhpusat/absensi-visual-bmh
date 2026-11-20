import { Suspense } from "react";
import { SiteHeader } from "@/components/rakernas/site-header";
import { WhatsAppFloatSlot } from "@/components/rakernas/whatsapp-float-slot";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

/**
 * Shared layout untuk situs publik (Beranda "/" dan "/registrasi").
 * Layout tetap terpasang saat berpindah halaman (partial rendering), jadi navbar
 * tidak di-remount dan hanya isi halaman (page.tsx) yang berganti.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* S0 — Header (Sticky), dipakai bersama oleh seluruh halaman publik */}
        <SiteHeader />
        {children}
        {/* Popup WhatsApp ter-pin kanan bawah; tautan mengikuti footer_url event settings */}
        <Suspense fallback={null}>
          <WhatsAppFloatSlot />
        </Suspense>
      </div>
    </SmoothScroll>
  );
}
