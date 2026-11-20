import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EVENT_INFO } from "@/content/rakernas";
import { getEventSettings } from "@/lib/event-settings-server";
import { RegistrationForm } from "@/components/registrasi/registration-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Registrasi Peserta Rakernas BMH 2027",
  description: "Formulir pendaftaran peserta Rakernas BMH 2027.",
};

export default async function RegistrasiPage() {
  const settings = await getEventSettings();

  return (
    <div className="display-theme display-bg flex min-h-screen flex-col text-foreground">
      <header className="border-b border-line/20">
        <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            aria-label={EVENT_INFO.name}
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 py-10 md:py-16">
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
        </div>
      </main>
    </div>
  );
}
