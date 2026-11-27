import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, ChevronRight, Globe, IdCard, MessageCircle, QrCode, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { PrivacyContents } from "@/components/rakernas/privacy-contents";
import { SiteFooter } from "@/components/rakernas/site-footer";
import { EVENT_INFO } from "@/content/rakernas";
import { getEventSettings } from "@/lib/event-settings-server";
import { buildSocialMetadata } from "@/lib/og-metadata";
import { getPrivacyContact, PRIVACY_SECTIONS, type PrivacySectionId } from "@/lib/privacy-policy";

export const instant = false;

const TITLE = "Kebijakan Privasi";
const EFFECTIVE_DATE = "24 November 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: `Data apa yang dikumpulkan situs ${EVENT_INFO.title}, untuk apa dipakai, dan cara meminta penghapusannya.`,
  ...buildSocialMetadata({ title: TITLE, path: "/kebijakan-privasi" }),
};

const DATA_CARDS = [
  {
    icon: Globe,
    title: "Login dengan Google",
    description: "Nama dan email akun Google. Tautan foto profil diterima layanan login, tetapi tidak ditampilkan.",
  },
  {
    icon: IdCard,
    title: "Akun peserta",
    description: "Email & kata sandi dari panitia, serta data profil: nama, perwakilan, jabatan, ukuran baju, WhatsApp, kedatangan, kehadiran, foto.",
  },
  {
    icon: QrCode,
    title: "Kehadiran",
    description: "Catatan presensi saat Anda memindai kode QR di lokasi acara.",
  },
];

function PolicySection({ id, children }: { id: PrivacySectionId; children: React.ReactNode }) {
  const section = PRIVACY_SECTIONS.find((item) => item.id === id)!;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[calc(96px+env(safe-area-inset-top))] space-y-3.5 border-t border-line pt-7 lg:pt-10">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{section.number}</span>
        <h2 id={`${id}-title`} className="font-heading text-[17px]/[1.4] font-bold text-primary lg:text-xl">{section.title}</h2>
      </div>
      {children}
    </section>
  );
}

function ContactCard({ contact, className }: { contact: ReturnType<typeof getPrivacyContact>; className?: string }) {
  return (
    <section aria-label="Kontak panitia" className={cn("flex flex-col items-start gap-2.5 rounded-[18px] bg-brand-green-night p-5 text-white", className)}>
      <h2 className="text-[11px] font-bold text-brand-gold">PUNYA PERTANYAAN?</h2>
      <p className="text-sm/[1.5]">Hubungi panitia untuk salinan, perbaikan, atau penghapusan data.</p>
      <a href={contact.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-brand-gold px-3.5 py-2.5 text-[13px] font-semibold text-brand-green-night transition-colors hover:bg-brand-gold-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
        <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
        <span className="wrap-anywhere">{contact.label}</span>
      </a>
    </section>
  );
}

/** Kebijakan publik untuk pengunjung dan verifikasi merek aplikasi OAuth Google. */
export default async function KebijakanPrivasiPage() {
  const settings = await getEventSettings();
  const contact = getPrivacyContact(settings.footerUrl);

  return (
    <>
      <main className="min-w-0 flex-1 bg-surface">
        <header id="privacy-hero" className="relative isolate overflow-hidden bg-brand-green-night text-white lg:min-h-[560px]">
          <Image src="/galeri-fasilitas-hotel/kamar.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-brand-green-night/60 to-brand-green-night/95 lg:bg-linear-to-r lg:from-brand-green-night/95 lg:via-brand-green-night/80 lg:via-55% lg:to-brand-green-night/35" />
          <div className="site-container flex flex-col items-start gap-3.5 pt-[calc(96px+env(safe-area-inset-top))] pb-10 lg:gap-[22px] lg:pt-[calc(150px+env(safe-area-inset-top))]">
            <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-[13px] text-white/70 lg:flex">
              <Link href="/" className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">Beranda</Link>
              <ChevronRight aria-hidden="true" className="size-3.5" />
              <span aria-current="page">{TITLE}</span>
            </nav>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/40 bg-brand-gold/15 px-3 py-[5px] text-[11px] font-semibold tracking-[1.6px] text-brand-gold-soft lg:gap-2 lg:px-3.5 lg:py-1.5 lg:text-xs">
              <ShieldCheck aria-hidden="true" className="size-3.5 lg:size-4" />
              PRIVASI &amp; DATA
            </span>
            <h1 className="font-heading text-[30px]/[1.2] font-bold lg:text-[56px]">{TITLE}</h1>
            <p className="max-w-[620px] text-sm/[1.6] text-white/85 lg:text-[17px]">
              Data apa yang dikumpulkan situs Rakernas BMH 2027, untuk apa dipakai, dan cara meminta penghapusannya.
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[13px] font-medium">
              <CalendarCheck aria-hidden="true" className="size-[15px] text-brand-gold" />
              Berlaku sejak {EFFECTIVE_DATE}
            </span>
          </div>
        </header>

        <div id="privacy-body" className="site-container grid min-w-0 gap-8 pt-5 pb-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10 lg:pt-10 lg:pb-[104px]">
          <aside className="contents lg:sticky lg:top-[calc(96px+env(safe-area-inset-top))] lg:block lg:self-start lg:space-y-4">
            <PrivacyContents />
            <ContactCard contact={contact} className="hidden lg:flex" />
          </aside>

          <article aria-label="Kebijakan privasi Rakernas BMH" className="min-w-0 space-y-7 rounded-[20px] border border-line bg-white p-5 text-sm/[1.75] text-ink lg:space-y-10 lg:rounded-[28px] lg:p-8 lg:text-[15px] xl:p-12">
            <p className="text-[15px]/[1.7] text-ink-muted lg:text-[17px]">
              Situs ini dikelola oleh Panitia Rakernas BMH 2027 untuk penyelenggaraan Rapat Kerja Nasional Baitul Maal Hidayatullah. Halaman ini menjelaskan data apa yang kami kumpulkan, untuk apa data itu dipakai, dan bagaimana Anda dapat meminta penghapusannya.
            </p>

            <PolicySection id="data-yang-dikumpulkan">
              <div className="grid items-start gap-3 xl:grid-cols-3">
                {DATA_CARDS.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex min-w-0 flex-col items-start gap-2.5 rounded-[14px] border border-line bg-surface p-4">
                    <span className="flex size-9 items-center justify-center rounded-[10px] border border-line bg-white text-brand-green-text"><Icon aria-hidden="true" className="size-[17px]" /></span>
                    <h3 className="text-sm font-bold text-ink">{title}</h3>
                    <p className="text-[13px]/[1.6] text-ink-muted">{description}</p>
                  </div>
                ))}
              </div>
            </PolicySection>

            <PolicySection id="penggunaan-data">
              <p>Data hanya dipakai untuk penyelenggaraan acara: pendaftaran dan verifikasi peserta, pengaturan akomodasi dan perlengkapan, presensi, serta komunikasi panitia dengan peserta. Kami tidak menjual data Anda, tidak membagikannya kepada pihak lain untuk iklan, dan tidak memakainya untuk keperluan di luar acara.</p>
              <div className="flex items-center gap-3 rounded-[14px] border border-green-100 bg-secondary p-4 text-sm font-semibold text-primary">
                <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-brand-green-text" />
                <p>Kami tidak menjual data Anda dan tidak memakainya untuk iklan.</p>
              </div>
            </PolicySection>

            <PolicySection id="data-publik">
              <p>Untuk peserta terdaftar, nama, perwakilan daerah, dan jabatan dapat tampil di layar presensi dan papan kehadiran acara. Email, nomor WhatsApp, dan rencana kedatangan tidak ditampilkan untuk umum. Akun yang belum terdaftar sebagai peserta, termasuk akun Google baru, tidak tampil di daftar peserta.</p>
            </PolicySection>

            <PolicySection id="penyimpanan-dan-keamanan">
              <p>Data disimpan di layanan basis data Supabase, dan situs dijalankan di Vercel. Akses ke data pribadi dibatasi untuk panitia yang berwenang. Situs memakai cookie yang diperlukan agar Anda tetap masuk dan untuk akses formulir; tidak ada cookie iklan atau pelacak pihak ketiga.</p>
            </PolicySection>

            <PolicySection id="hak-dan-penghapusan-data">
              <p>
                Anda dapat meminta salinan, perbaikan, atau penghapusan data Anda kapan saja dengan menghubungi panitia melalui WhatsApp. Anda juga dapat mencabut akses situs ini dari akun Google Anda di{" "}
                <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer" className="wrap-anywhere font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">myaccount.google.com/connections</a>.
              </p>
              <a href={contact.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-green-night focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                {contact.phone ? "Hubungi panitia via WhatsApp" : "Hubungi Panitia"}
              </a>
            </PolicySection>

            <PolicySection id="perubahan-kebijakan">
              <p>Kebijakan ini dapat diperbarui bila cara kami mengelola data berubah. Tanggal berlaku di bagian atas halaman akan ikut diperbarui.</p>
            </PolicySection>
          </article>

          <ContactCard contact={contact} className="lg:hidden" />
        </div>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
