import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { FOOTER_DATA } from "@/content/rakernas";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      id="footer"
      className={cn("bg-brand-green-night text-white py-12 md:py-16", className)}
    >
      <div className="mx-auto w-full max-w-screen-xl px-5 md:px-8 text-center flex flex-col items-center justify-center space-y-6">
        {/* Satu Logo Tunggal (maksimal tinggi 40 px) */}
        <Link
          href="/"
          className="inline-block transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
          aria-label="Kembali ke atas"
        >
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm border border-white/10">
            <Image
              src={FOOTER_DATA.logoSrc}
              alt={FOOTER_DATA.logoAlt}
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </div>
        </Link>

        {/* Teks Informasi & Tautan Panitia */}
        <div className="space-y-2 max-w-md">
          <p className="text-sm text-white/80 leading-relaxed font-sans">
            {FOOTER_DATA.text}
          </p>
          <p className="text-sm text-white/80">
            Diselenggarakan oleh{" "}
            <a
              href={FOOTER_DATA.committee.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gold-soft font-medium underline underline-offset-4 hover:text-white transition-colors"
            >
              {FOOTER_DATA.committee.label}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
