import { Check } from "lucide-react";
import { PopIn, Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

export default function AbsenSelesaiPage() {
  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <Reveal immediate className="w-full max-w-sm mx-auto text-center space-y-6 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-line shadow-sm">
        <PopIn delay={0.15} className="w-20 h-20 mx-auto rounded-full bg-brand-green flex items-center justify-center shadow-md">
          <Check className="w-10 h-10 text-white stroke-[2.5]" />
        </PopIn>
        <RevealStagger immediate delay={0.3} stagger={0.1} className="space-y-2">
          <RevealItem><span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-primary border border-brand-green/20">
            Presensi Berhasil
          </span></RevealItem>
          <RevealItem><h1 className="font-heading text-2xl font-bold text-primary tracking-tight">
            Kehadiran Tercatat
          </h1></RevealItem>
          <RevealItem><p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Terima kasih telah melakukan konfirmasi kehadiran. Halaman ini telah selesai dan dapat Anda tutup.
          </p></RevealItem>
        </RevealStagger>
        <div className="pt-4 border-t border-line/60">
          <p className="text-xs text-ink-muted">
            Baitul Maal Hidayatullah &bull; Rapat Kerja Nasional
          </p>
        </div>
      </Reveal>
    </main>
  );
}
