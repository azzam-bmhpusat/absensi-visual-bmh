import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

/** Tombol bawah card Publikasi: aktif (buka tab baru) bila link diisi admin, nonaktif bila kosong. */
export function CardLinkButton({
  href,
  label,
  children,
}: {
  href: string | null;
  /** Nama aksesibel unik per card, mis. "Unduh materi Laporan Kinerja BMH". */
  label: string;
  children: React.ReactNode;
}) {
  const className = cn(buttonVariants(), "!mt-auto w-full");
  if (!href) {
    return (
      <button type="button" disabled className={className} aria-label={`${label} (belum tersedia)`}>
        {children}
      </button>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={`${label} (tab baru)`}>
      {children}
    </a>
  );
}
