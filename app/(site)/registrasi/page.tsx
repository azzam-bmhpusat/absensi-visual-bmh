import type { Metadata } from "next";
import { getEventSettings } from "@/lib/event-settings-server";
import { RegistrationForm } from "@/components/registrasi/registration-form";
import { ShareButtons } from "@/components/registrasi/share-buttons";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

const REGISTRASI_TITLE = "Registrasi Peserta Rakernas BMH 2027";

export const metadata: Metadata = {
  title: REGISTRASI_TITLE,
  description: "Formulir pendaftaran peserta Rakernas BMH 2027.",
  ...buildSocialMetadata({ title: REGISTRASI_TITLE, path: "/registrasi" }),
};

export default async function RegistrasiPage() {
  const settings = await getEventSettings();

  return (
    <>
      {/* Navbar berasal dari app/(site)/layout.tsx (dipakai bersama beranda) */}
      <main className="display-theme display-bg flex-1 px-5 py-10 text-foreground md:py-16">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-8 space-y-3 text-center">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-gold-soft md:text-4xl">
              Registrasi Peserta Rakernas BMH 2027
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Lengkapi data berikut untuk mendaftar. Pendaftaran akan ditinjau oleh panitia.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm md:p-8">
            <RegistrationForm footerUrl={settings.footerUrl} />
          </div>
          <ShareButtons />
        </div>
      </main>
    </>
  );
}
