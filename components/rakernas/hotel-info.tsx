import { BedDouble, Building2, Users } from "lucide-react";
import { cn } from "cn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHero } from "@/components/rakernas/page-hero";
import { DaftarKamar } from "@/components/rakernas/daftar-kamar";
import { DAFTAR_KAMAR, INFO_PENTING, KONTAK_PANITIA } from "@/lib/hotel-dummy";

/** Header halaman: foto kamar hotel dengan judul dan ringkasan jumlah kamar/peserta. */
export function HotelHero({ title }: { title: string }) {
  const totalPeserta = DAFTAR_KAMAR.reduce((n, k) => n + k.penghuni.length, 0);
  const totalLantai = new Set(DAFTAR_KAMAR.map((k) => k.lantai)).size;
  const stats = [
    { icon: BedDouble, value: DAFTAR_KAMAR.length, label: "Kamar" },
    { icon: Users, value: totalPeserta, label: "Peserta" },
    { icon: Building2, value: totalLantai, label: "Lantai" },
  ];

  return (
    <PageHero
      title={title}
      badge={{ icon: BedDouble, label: "Pembagian Kamar" }}
      description="Temukan kamar dan teman sekamar Anda selama Rakernas BMH. Gunakan pencarian untuk mencari nama peserta."
      image="/galeri-fasilitas-hotel/kamar.jpg"
      stats={stats}
    />
  );
}

/** Pembagian kamar peserta dan ketentuan hotel (masih data dummy). */
export function HotelInfo() {
  return (
    <div className="space-y-10">
      <section aria-label="Pembagian kamar">
        <DaftarKamar kamar={DAFTAR_KAMAR} />
      </section>

      <section aria-labelledby="info-penting" className="space-y-4">
        <h2 id="info-penting" className="text-xl font-semibold">
          Info &amp; Ketentuan
        </h2>
        <div
          className={cn(
            "rounded-2xl border border-line bg-white/80 px-5 shadow-sm dark:bg-card/60"
          )}
        >
          <Accordion>
            {INFO_PENTING.map((info) => (
              <AccordionItem key={info.judul} value={info.judul}>
                <AccordionTrigger>{info.judul}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{info.isi}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <p className="text-sm text-muted-foreground">
          Ada kendala kamar?{" "}
          <a
            href={`https://wa.me/${KONTAK_PANITIA.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-green-deep underline underline-offset-4 dark:text-brand-gold-soft"
          >
            Hubungi {KONTAK_PANITIA.nama}
          </a>
        </p>
      </section>
    </div>
  );
}
